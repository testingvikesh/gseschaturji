<?php
declare(strict_types=1);

/**
 * Materials API — pass / list / get JSON from MySQL
 *
 * GET  api/materials.php              → list materials
 * GET  api/materials.php?id=1         → one material (+ full JSON)
 * GET  api/materials.php?slug=xyz     → one material by slug
 * GET  api/materials.php?chapter=xyz  → chapter JSON by slug/id
 * POST api/materials.php              → upload/upsert JSON body
 *      {
 *        "chapter": { ...chapter json... },
 *        "material": { ...material json... },
 *        "chapter_json_name": "optional.json",
 *        "material_json_name": "optional.json",
 *        "html_name": "optional.html"
 *      }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$baseDir = dirname(__DIR__);
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'MaterialStore.php';
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Auth.php';

Auth::requireLogin($baseDir);
$store = new MaterialStore($baseDir);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['chapter'])) {
            $row = $store->getChapter($_GET['chapter'], true);
            if (!$row) {
                respond(['success' => false, 'error' => 'Chapter not found'], 404);
            }
            respond(['success' => true, 'chapter' => $row]);
        }

        if (isset($_GET['id']) || isset($_GET['slug'])) {
            $key = $_GET['id'] ?? $_GET['slug'];
            $row = $store->getMaterial($key, true);
            if (!$row) {
                respond(['success' => false, 'error' => 'Material not found'], 404);
            }
            respond(['success' => true, 'material' => $row]);
        }

        $limit = (int) ($_GET['limit'] ?? 50);
        $withTopics = isset($_GET['with_topics']) && in_array(
            strtolower((string) $_GET['with_topics']),
            ['1', 'true', 'yes'],
            true
        );
        $user = Auth::currentUser();
        $userId = isset($user['id']) ? (int) $user['id'] : null;
        $role = strtolower(trim((string) ($user['role'] ?? '')));
        $standard = Auth::normalizeStandardValue((string) ($user['standard'] ?? ''));
        // Teachers only see their own materials (and matching standard when set)
        if ($role === 'admin') {
            $items = $store->listMaterials($limit, null, null, $withTopics);
        } else {
            $items = $store->listMaterials(
                $limit,
                $userId > 0 ? $userId : null,
                $standard !== '' ? $standard : null,
                $withTopics
            );
            // Fallback: older rows may lack user_id — still filter by standard
            if (!$items && $standard !== '') {
                $items = $store->listMaterials($limit, null, $standard, $withTopics);
            }
        }
        respond(['success' => true, 'items' => $items]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        $body = json_decode($raw ?: '', true);
        if (!is_array($body)) {
            respond(['success' => false, 'error' => 'JSON body required'], 400);
        }

        $chapter = $body['chapter'] ?? null;
        $material = $body['material'] ?? ($body['material_json'] ?? null);

        // Allow posting raw material JSON as root
        if (!$material && isset($body['meta']) && isset($body['sections'])) {
            $material = $body;
            $chapter = null;
        }

        if (!is_array($material)) {
            respond(['success' => false, 'error' => 'material JSON is required'], 400);
        }

        $saved = $store->upsert(is_array($chapter) ? $chapter : null, $material, [
            'chapter_json_name' => $body['chapter_json_name'] ?? null,
            'material_json_name' => $body['material_json_name'] ?? null,
            'html_name' => $body['html_name'] ?? null,
            'topics_meta' => $body['topics'] ?? null,
        ]);

        respond([
            'success' => true,
            'db_saved' => true,
            'material' => [
                'id' => $saved['id'] ?? null,
                'slug' => $saved['slug'] ?? null,
                'status' => $saved['status'] ?? null,
                'topics_done' => $saved['topics_done'] ?? null,
                'topics_total' => $saved['topics_total'] ?? null,
                'topics' => $saved['topics'] ?? [],
            ],
        ]);
    }

    respond(['success' => false, 'error' => 'Method not allowed'], 405);
} catch (Throwable $e) {
    respond(['success' => false, 'error' => $e->getMessage()], 500);
}

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
