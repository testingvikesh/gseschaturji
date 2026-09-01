<?php
declare(strict_types=1);

set_time_limit(3600);

header('Content-Type: application/json; charset=utf-8');

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED = ['application/pdf'];

$baseDir = dirname(__DIR__);
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'MaterialStore.php';
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'find-node.php';
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Auth.php';

$user = Auth::requireLogin($baseDir);

$uploadDir = $baseDir . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
$outputDir = $baseDir . DIRECTORY_SEPARATOR . 'output';
$nodeScript = $baseDir . DIRECTORY_SEPARATOR . 'process-pdf.js';
$store = new MaterialStore($baseDir);

require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Catalog.php';

foreach ([$uploadDir, $outputDir] as $dir) {
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        respond(['success' => false, 'error' => 'Cannot create directory: ' . $dir], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'POST required'], 405);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
$postMax = return_bytes((string) ini_get('post_max_size'));
if ($contentLength > 0 && empty($_POST) && empty($_FILES) && $postMax > 0 && $contentLength > $postMax) {
    respond([
        'success' => false,
        'error' => 'Upload exceeds PHP post_max_size (' . ini_get('post_max_size') . '). Increase it in php.ini and restart Apache.',
    ], 413);
}

$formMeta = [
    'medium' => trim((string) ($_POST['medium'] ?? '')),
    'standard' => trim((string) ($_POST['standard'] ?? '')),
    'subject' => trim((string) ($_POST['subject'] ?? '')),
    'chapter_no' => trim((string) ($_POST['chapter_no'] ?? '')),
    'chapter_name' => trim((string) ($_POST['chapter_name'] ?? '')),
];

foreach (['medium', 'standard', 'subject', 'chapter_no', 'chapter_name'] as $required) {
    if ($formMeta[$required] === '') {
        respond(['success' => false, 'error' => "Field required: {$required}"], 400);
    }
}

// Save typed subject into subjects table for this standard (if new)
$subjectRow = null;
$errors = [];
try {
    $subjectRow = Catalog::ensureSubject($baseDir, $formMeta['standard'], $formMeta['subject']);
    $formMeta['subject'] = $subjectRow['name'];
} catch (Throwable $e) {
    // Non-fatal: still generate with typed subject name
    $errors[] = 'Subject catalog: ' . $e->getMessage();
}

$chapterFile = $_FILES['chapter_pdf'] ?? null;
$aiScript = $baseDir . DIRECTORY_SEPARATOR . 'generate-material-ai.js';

if (!$chapterFile || ($chapterFile['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
    respond(['success' => false, 'error' => 'Chapter PDF is required'], 400);
}

$results = [];

$chapterOutputFile = null;

try {
    $displayName = 'Chapter-' . $formMeta['chapter_name'] . '.pdf';
    $chapterSaved = saveUpload($chapterFile, $uploadDir, null);
    $chapterResult = runProcessor(
        $nodeScript,
        $chapterSaved['path'],
        'chapter',
        $outputDir,
        $displayName
    );
    $chapterOutputFile = $chapterResult['output_file'] ?? null;
    if ($chapterOutputFile && is_file($chapterOutputFile)) {
        $chapterOutputFile = applyChapterFormMeta(
            $chapterOutputFile,
            $formMeta,
            $chapterSaved['original_name'],
            $user
        );
    }
} catch (Throwable $e) {
    respond(['success' => false, 'error' => 'Chapter: ' . $e->getMessage()], 500);
}

if ($chapterOutputFile && is_file($chapterOutputFile)) {
    try {
        $aiResult = runAiGenerator($aiScript, $chapterOutputFile, $outputDir);
        $results['material_ai'] = $aiResult;
        $results['chapter_json'] = [
            'path' => $chapterOutputFile,
            'name' => basename($chapterOutputFile),
        ];
        $results['form'] = $formMeta;
    } catch (Throwable $e) {
        respond(['success' => false, 'error' => 'AI Material: ' . $e->getMessage()], 500);
    }
} else {
    respond(['success' => false, 'error' => 'Chapter JSON was not created — cannot generate AI material'], 500);
}

$dbRow = null;
$dbError = null;
try {
    $attachmentRel = 'public/uploads/' . ($chapterSaved['stored_name'] ?? '');
    $dbRow = $store->saveFromGenerateResult($results['material_ai'], $chapterOutputFile, [
        'user_id' => $user['id'],
        'medium' => $formMeta['medium'],
        'standard' => $formMeta['standard'],
        'subject' => $formMeta['subject'],
        'chapter_no' => $formMeta['chapter_no'],
        'chapter_name' => $formMeta['chapter_name'],
        'pdf_name' => $chapterSaved['original_name'] ?? null,
        'material_attachment' => $attachmentRel,
    ]);
    $results['database'] = [
        'id' => $dbRow['id'] ?? null,
        'slug' => $dbRow['slug'] ?? null,
        'status' => $dbRow['status'] ?? null,
        'topics_done' => $dbRow['topics_done'] ?? null,
        'topics_total' => $dbRow['topics_total'] ?? null,
        'medium' => $dbRow['medium'] ?? $formMeta['medium'],
        'standard' => $dbRow['standard'] ?? $formMeta['standard'],
        'subject' => $dbRow['subject'] ?? $formMeta['subject'],
        'chapter_no' => $dbRow['chapter_no'] ?? $formMeta['chapter_no'],
        'chapter_name' => $dbRow['chapter_name'] ?? $formMeta['chapter_name'],
        'material_attachment' => $dbRow['material_attachment'] ?? $attachmentRel,
    ];
    $results['material_attachment'] = $attachmentRel;
    $results['material_attachment_url'] = $attachmentRel;
    if ($subjectRow) {
        $results['subject_catalog'] = $subjectRow;
    }
} catch (Throwable $e) {
    $dbError = $e->getMessage();
    $errors[] = 'MySQL: ' . $dbError;
}

respond([
    'success' => true,
    'results' => $results,
    'errors' => $errors,
    'db_saved' => $dbRow !== null,
    'db_error' => $dbError,
    'download_urls' => buildDownloadUrls($results),
]);

function applyChapterFormMeta(string $chapterJsonPath, array $formMeta, string $pdfName, array $user): string
{
    $raw = file_get_contents($chapterJsonPath);
    $data = json_decode((string) $raw, true);
    if (!is_array($data)) {
        throw new RuntimeException('Invalid chapter JSON after OCR');
    }

    $data['meta'] = $data['meta'] ?? [];
    $data['meta']['title'] = $formMeta['chapter_name'];
    $data['meta']['chapter_name'] = $formMeta['chapter_name'];
    $data['meta']['chapter_no'] = $formMeta['chapter_no'];
    $data['meta']['medium'] = $formMeta['medium'];
    $data['meta']['standard'] = $formMeta['standard'];
    $data['meta']['subject'] = $formMeta['subject'];
    $data['meta']['source_file'] = $pdfName;
    $data['meta']['uploaded_by'] = $user['username'] ?? null;
    $data['meta']['user_id'] = $user['id'] ?? null;

    $slugParts = [
        $formMeta['medium'],
        'std' . $formMeta['standard'],
        $formMeta['subject'],
        'ch' . $formMeta['chapter_no'],
        $formMeta['chapter_name'],
    ];
    $slug = implode('-', $slugParts);
    $slug = mb_strtolower($slug, 'UTF-8');
    $slug = preg_replace('/[^\p{L}\p{N}]+/u', '-', $slug) ?? $slug;
    $slug = trim($slug, '-') ?: ($data['meta']['id'] ?? 'chapter');
    $slug = mb_substr($slug, 0, 180);
    $data['meta']['id'] = $slug;

    $encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($encoded === false) {
        throw new RuntimeException('Failed to rewrite chapter JSON meta');
    }

    $dir = dirname($chapterJsonPath);
    $newPath = $dir . DIRECTORY_SEPARATOR . $slug . '-chapter.json';
    file_put_contents($newPath, $encoded);

    $oldReal = realpath($chapterJsonPath) ?: $chapterJsonPath;
    $newReal = realpath($newPath) ?: $newPath;
    if ($oldReal !== $newReal && is_file($chapterJsonPath)) {
        @unlink($chapterJsonPath);
    }

    return $newPath;
}function saveUpload(array $file, string $dir, ?string $expectedPrefix = null): array
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException(uploadErrorMessage($file['error']));
    }

    if ($file['size'] > MAX_BYTES) {
        throw new RuntimeException('File too large (max 100 MB)');
    }

    $mime = detectUploadMime($file['tmp_name']);
    $original = basename($file['name']);
    $isPdfExt = (bool) preg_match('/\.pdf$/i', $original);
    $isPdfMime = $mime === '' || in_array($mime, ALLOWED, true) || str_contains($mime, 'pdf');

    if (!$isPdfExt || !$isPdfMime) {
        throw new RuntimeException('Only PDF files allowed' . ($mime !== '' ? " (got: {$mime})" : ''));
    }

    if ($expectedPrefix && stripos($original, $expectedPrefix) !== 0) {
        throw new RuntimeException("Filename should start with {$expectedPrefix}- (e.g. {$expectedPrefix}-અમારી કામધેનુ.pdf)");
    }

    $safeName = preg_replace('/[^\p{L}\p{N}\-_.]/u', '_', $original) ?: 'upload.pdf';
    $stored = date('Ymd_His') . '_' . $safeName;
    $dest = $dir . DIRECTORY_SEPARATOR . $stored;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new RuntimeException('Failed to save uploaded file');
    }

    return [
        'original_name' => $original,
        'stored_name' => $stored,
        'path' => $dest,
    ];
}

function runProcessor(string $script, string $pdfPath, string $type, string $outDir, string $originalName): array
{
    $node = findNodeBinary();
    $cmd = escapeshellarg($node) . ' '
        . escapeshellarg($script) . ' '
        . escapeshellarg($pdfPath) . ' '
        . '--type ' . escapeshellarg($type) . ' '
        . '--name ' . escapeshellarg($originalName) . ' '
        . '--out ' . escapeshellarg($outDir);

    $output = [];
    $code = 0;
    exec($cmd . ' 2>&1', $output, $code);
    $text = trim(implode("\n", $output));

    if ($code !== 0) {
        throw new RuntimeException($text ?: 'Processor failed');
    }

    $jsonLine = '';
    foreach ($output as $line) {
        $line = trim($line);
        if ($line !== '' && str_starts_with($line, '{')) {
            $jsonLine = $line;
        }
    }

    $parsed = json_decode($jsonLine ?: $text, true);
    if (!is_array($parsed) || empty($parsed['success'])) {
        throw new RuntimeException($text ?: 'Invalid processor response');
    }

    return $parsed;
}

function runAiGenerator(string $script, string $chapterJsonPath, string $outDir, array $extraArgs = []): array
{
    $node = findNodeBinary();
    $cmd = escapeshellarg($node) . ' '
        . escapeshellarg($script) . ' '
        . escapeshellarg($chapterJsonPath) . ' '
        . '--out ' . escapeshellarg($outDir);

    foreach ($extraArgs as $arg) {
        $cmd .= ' ' . escapeshellarg((string) $arg);
    }

    $output = [];
    $code = 0;
    exec($cmd . ' 2>&1', $output, $code);
    $text = trim(implode("\n", $output));

    if ($code !== 0) {
        throw new RuntimeException($text ?: 'AI generator failed');
    }

    $jsonLine = '';
    foreach ($output as $line) {
        $line = trim($line);
        if ($line !== '' && str_starts_with($line, '{')) {
            $jsonLine = $line;
        }
    }

    $parsed = json_decode($jsonLine ?: $text, true);
    if (!is_array($parsed) || empty($parsed['success'])) {
        throw new RuntimeException($text ?: 'Invalid AI generator response');
    }

    return $parsed;
}

function buildDownloadUrls(array $results): array
{
    $urls = [];
    foreach ($results as $key => $row) {
        if (!empty($row['output_name'])) {
            $urls[$key] = 'output/' . rawurlencode($row['output_name']);
        }
        if (!empty($row['html_name'])) {
            $urls[$key . '_html'] = 'output/' . rawurlencode($row['html_name']);
            $urls[$key . '_view'] = 'view.php?file=' . rawurlencode($row['output_name']);
        }
        if (!empty($row['topic_files']) && is_array($row['topic_files'])) {
            $urls['topics'] = [];
            foreach ($row['topic_files'] as $tf) {
                $order = (int) ($tf['order'] ?? 0);
                if ($order < 1) {
                    continue;
                }
                $item = ['order' => $order];
                if (!empty($tf['json_name'])) {
                    $item['json'] = 'output/' . rawurlencode($tf['json_name']);
                    $item['view'] = 'view.php?file=' . rawurlencode($tf['json_name']);
                    $item['json_name'] = $tf['json_name'];
                }
                if (!empty($tf['html_name'])) {
                    $item['html'] = 'output/' . rawurlencode($tf['html_name']);
                    $item['html_name'] = $tf['html_name'];
                }
                $urls['topics'][$order] = $item;
            }
        }
    }
    return $urls;
}

function detectUploadMime(string $tmpPath): string
{
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmpPath);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    if (function_exists('mime_content_type')) {
        $mime = @mime_content_type($tmpPath);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    // Fallback: check PDF magic header
    $fh = @fopen($tmpPath, 'rb');
    if ($fh) {
        $head = fread($fh, 5);
        fclose($fh);
        if (is_string($head) && str_starts_with($head, '%PDF-')) {
            return 'application/pdf';
        }
    }

    return '';
}

function uploadErrorMessage(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Upload exceeds size limit',
        UPLOAD_ERR_PARTIAL => 'Upload was incomplete',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by extension',
        default => 'Upload failed',
    };
}

function return_bytes(string $value): int
{
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $unit = strtolower(substr($value, -1));
    $num = (float) $value;
    return (int) match ($unit) {
        'g' => $num * 1024 * 1024 * 1024,
        'm' => $num * 1024 * 1024,
        'k' => $num * 1024,
        default => $num,
    };
}

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
