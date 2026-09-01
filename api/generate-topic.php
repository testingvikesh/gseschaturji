<?php
declare(strict_types=1);

set_time_limit(3600);

header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__);
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'MaterialStore.php';
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'find-node.php';
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Auth.php';

$user = Auth::requireLogin($baseDir);

$outputDir = $baseDir . DIRECTORY_SEPARATOR . 'output';
$aiScript = $baseDir . DIRECTORY_SEPARATOR . 'generate-material-ai.js';
$store = new MaterialStore($baseDir);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'POST required'], 405);
}

$chapterJsonName = trim((string) ($_POST['chapter_json'] ?? ''));
$topicIndex = (int) ($_POST['topic_index'] ?? 0);

if ($chapterJsonName === '') {
    respond(['success' => false, 'error' => 'chapter_json is required'], 400);
}

if ($topicIndex < 1) {
    respond(['success' => false, 'error' => 'topic_index must be >= 1'], 400);
}

$safeName = basename(urldecode($chapterJsonName));
// Allow Gujarati/Hindi letters + combining marks (matras) in filenames
if (
    $safeName === '' ||
    !preg_match('/\.json$/iu', $safeName) ||
    preg_match('/[\/\\\\]/', $safeName) ||
    !preg_match('/^[\p{L}\p{N}\p{M}\p{Pc}\p{Pd}._\-]+\.json$/u', $safeName)
) {
    respond(['success' => false, 'error' => 'Invalid chapter JSON filename: ' . $safeName], 400);
}

$chapterPath = $outputDir . DIRECTORY_SEPARATOR . $safeName;
if (!is_file($chapterPath)) {
    respond(['success' => false, 'error' => 'Chapter JSON not found: ' . $safeName], 404);
}

try {
    $aiResult = runAiGenerator($aiScript, $chapterPath, $outputDir, ['--topic', (string) $topicIndex]);
} catch (Throwable $e) {
    respond(['success' => false, 'error' => 'AI Material: ' . $e->getMessage()], 500);
}

$chapterMeta = [];
if (is_file($chapterPath)) {
    $cj = json_decode((string) file_get_contents($chapterPath), true);
    if (is_array($cj)) {
        $chapterMeta = $cj['meta'] ?? [];
    }
}

$dbRow = null;
$dbError = null;
$errors = [];
try {
    $dbRow = $store->saveFromGenerateResult($aiResult, $chapterPath, [
        'user_id' => $user['id'],
        'medium' => $chapterMeta['medium'] ?? null,
        'standard' => $chapterMeta['standard'] ?? null,
        'subject' => $chapterMeta['subject'] ?? null,
        'chapter_no' => $chapterMeta['chapter_no'] ?? null,
        'chapter_name' => $chapterMeta['chapter_name'] ?? ($chapterMeta['title'] ?? null),
        'pdf_name' => $chapterMeta['source_file'] ?? null,
    ]);
} catch (Throwable $e) {
    $dbError = $e->getMessage();
    $errors[] = 'MySQL: ' . $dbError;
}

respond([
    'success' => true,
    'topic_index' => $topicIndex,
    'results' => [
        'material_ai' => $aiResult,
        'database' => $dbRow ? [
            'id' => $dbRow['id'] ?? null,
            'slug' => $dbRow['slug'] ?? null,
            'status' => $dbRow['status'] ?? null,
            'topics_done' => $dbRow['topics_done'] ?? null,
            'topics_total' => $dbRow['topics_total'] ?? null,
        ] : null,
    ],
    'errors' => $errors,
    'db_saved' => $dbRow !== null,
    'db_error' => $dbError,
    'download_urls' => buildDownloadUrls(['material_ai' => $aiResult]),
    'topic_files' => $aiResult['topic_files'] ?? [],
]);

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

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
