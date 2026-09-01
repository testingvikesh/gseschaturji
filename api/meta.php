<?php
declare(strict_types=1);

/**
 * Fetch Standard / Subject / Chapter lists from shared db_ai tables.
 *
 * GET api/meta.php                 → { standards: [...] }
 * GET api/meta.php?standard_id=9   → { subjects: [...] }
 * GET api/meta.php?subject_id=4    → { chapters: [...] }
 * GET api/meta.php?all=1           → standards + subjects + chapters
 */

header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__);
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Database.php';
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Auth.php';

Auth::requireLogin($baseDir);
$user = Auth::currentUser();

try {
    $pdo = Database::pdo($baseDir);

    if (isset($_GET['subject_id']) || isset($_GET['subject'])) {
        $subjectId = (int) ($_GET['subject_id'] ?? 0);
        if ($subjectId < 1 && !empty($_GET['subject'])) {
            $subjectId = resolveSubjectId($pdo, (string) $_GET['subject']);
        }
        $chapters = fetchChapters($pdo, $subjectId > 0 ? $subjectId : null);
        echo json_encode(['success' => true, 'chapters' => $chapters], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (isset($_GET['standard_id']) || isset($_GET['standard'])) {
        $standardId = (int) ($_GET['standard_id'] ?? $_GET['standard'] ?? 0);
        $subjects = fetchSubjects($pdo, $standardId > 0 ? $standardId : null);
        echo json_encode(['success' => true, 'subjects' => $subjects], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Full standards list for dropdown; user_standard is the default selection
    $standards = fetchStandards($pdo, null);
    $out = [
        'success' => true,
        'standards' => $standards,
        'user_standard' => $user['standard'] ?? '',
        'standard_locked' => false,
    ];

    if (!empty($_GET['all'])) {
        $out['subjects'] = fetchSubjects($pdo, null);
        $out['chapters'] = fetchChapters($pdo, null);
    }

    echo json_encode($out, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

/**
 * null = admin / no restriction (show all)
 * string = only this standard number/value
 */
function allowedStandardFilter(?array $user): ?string
{
    if (!$user) {
        return null;
    }
    $role = strtolower(trim((string) ($user['role'] ?? '')));
    if ($role === 'admin') {
        return null;
    }
    $std = Auth::normalizeStandardValue((string) ($user['standard'] ?? ''));
    return $std !== '' ? $std : null;
}

function fetchStandards(PDO $pdo, ?string $onlyStandard = null): array
{
    $stmt = $pdo->query(
        'SELECT id, name, slug, sort_order
         FROM standards
         WHERE is_active = 1
         ORDER BY sort_order ASC, id ASC'
    );
    $rows = [];
    foreach ($stmt as $r) {
        $sort = (int) $r['sort_order'];
        $id = (int) $r['id'];
        // Prefer sort_order as form value when it looks like a class number 1-12
        $value = (string) ($sort >= 1 && $sort <= 12 ? $sort : ($id >= 1 && $id <= 12 ? $id : ($sort > 0 ? $sort : $id)));
        $item = [
            'id' => $id,
            'name' => (string) $r['name'],
            'slug' => (string) $r['slug'],
            'value' => $value,
        ];
        if ($onlyStandard !== null && $onlyStandard !== '') {
            $slug = strtolower((string) $r['slug']);
            $name = strtolower((string) $r['name']);
            $match =
                $value === $onlyStandard
                || (string) $id === $onlyStandard
                || (string) $sort === $onlyStandard
                || $slug === 'standard_' . $onlyStandard
                || $slug === 'std' . $onlyStandard
                || $slug === 'std_' . $onlyStandard
                || $slug === $onlyStandard
                || preg_match('/(?:^|[^0-9])' . preg_quote($onlyStandard, '/') . '(?:[^0-9]|$)/', $name);
            if (!$match) {
                continue;
            }
        }
        $rows[] = $item;
    }

    // If teacher is locked to a standard missing from catalog, still expose it
    if ($onlyStandard !== null && $onlyStandard !== '' && !$rows) {
        $num = (int) $onlyStandard;
        $rows[] = [
            'id' => $num > 0 ? $num : 0,
            'name' => $num > 0 ? ('Std ' . $num) : $onlyStandard,
            'slug' => 'standard_' . $onlyStandard,
            'value' => $onlyStandard,
        ];
    }

    return $rows;
}

function fetchSubjects(PDO $pdo, ?int $standardId): array
{
    if ($standardId !== null && $standardId > 0) {
        $stmt = $pdo->prepare(
            'SELECT id, standard_id, name, slug, sort_order
             FROM subjects
             WHERE is_active = 1 AND standard_id = ?
             ORDER BY sort_order ASC, name ASC'
        );
        $stmt->execute([$standardId]);
    } else {
        $stmt = $pdo->query(
            'SELECT id, standard_id, name, slug, sort_order
             FROM subjects
             WHERE is_active = 1
             ORDER BY sort_order ASC, name ASC'
        );
    }

    $rows = [];
    foreach ($stmt as $r) {
        $rows[] = [
            'id' => (int) $r['id'],
            'standard_id' => (int) $r['standard_id'],
            'name' => (string) $r['name'],
            'slug' => (string) $r['slug'],
            'value' => (string) $r['name'],
        ];
    }
    return $rows;
}

function resolveSubjectId(PDO $pdo, string $nameOrId): int
{
    if (ctype_digit($nameOrId)) {
        return (int) $nameOrId;
    }
    $stmt = $pdo->prepare('SELECT id FROM subjects WHERE name = ? OR slug = ? LIMIT 1');
    $stmt->execute([$nameOrId, $nameOrId]);
    return (int) ($stmt->fetchColumn() ?: 0);
}

function fetchChapters(PDO $pdo, ?int $subjectId): array
{
    if ($subjectId !== null && $subjectId > 0) {
        $stmt = $pdo->prepare(
            'SELECT id, subject_id, name, slug, sort_order
             FROM chapters
             WHERE is_active = 1 AND subject_id = ?
             ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute([$subjectId]);
    } else {
        $stmt = $pdo->query(
            'SELECT id, subject_id, name, slug, sort_order
             FROM chapters
             WHERE is_active = 1
             ORDER BY subject_id ASC, sort_order ASC, id ASC'
        );
    }

    $rows = [];
    foreach ($stmt as $r) {
        $no = (int) $r['sort_order'] > 0 ? (int) $r['sort_order'] : (int) $r['id'];
        $rows[] = [
            'id' => (int) $r['id'],
            'subject_id' => (int) $r['subject_id'],
            'name' => (string) $r['name'],
            'slug' => (string) $r['slug'],
            'chapter_no' => (string) $no,
            'value' => (string) $r['name'],
            'label' => $no . '. ' . (string) $r['name'],
        ];
    }
    return $rows;
}
