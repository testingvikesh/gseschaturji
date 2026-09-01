<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

final class MaterialStore
{
    public function __construct(private string $baseDir)
    {
    }

    public function saveFromGenerateResult(array $aiResult, ?string $chapterJsonPath = null, array $extra = []): array
    {
        $outputDir = $this->baseDir . DIRECTORY_SEPARATOR . 'output';

        $chapterJsonName = $aiResult['chapter_json_name']
            ?? ($chapterJsonPath ? basename($chapterJsonPath) : null);
        $materialJsonName = $aiResult['output_name'] ?? null;

        $chapterJson = null;
        $chapterPath = $chapterJsonPath;
        if (!$chapterPath && $chapterJsonName) {
            $chapterPath = $outputDir . DIRECTORY_SEPARATOR . $chapterJsonName;
        }
        if ($chapterPath && is_file($chapterPath)) {
            $chapterJson = json_decode((string) file_get_contents($chapterPath), true);
        }

        $materialJson = null;
        if ($materialJsonName) {
            $materialPath = $outputDir . DIRECTORY_SEPARATOR . $materialJsonName;
            if (is_file($materialPath)) {
                $materialJson = json_decode((string) file_get_contents($materialPath), true);
            }
        }

        if (!is_array($materialJson)) {
            throw new RuntimeException('Material JSON file not found for MySQL save');
        }

        return $this->upsert($chapterJson, $materialJson, [
            'chapter_json_name' => $chapterJsonName,
            'material_json_name' => $materialJsonName,
            'html_name' => $aiResult['html_name'] ?? null,
            'topics_meta' => $aiResult['topics'] ?? null,
            'user_id' => $extra['user_id'] ?? null,
            'medium' => $extra['medium'] ?? null,
            'standard' => $extra['standard'] ?? null,
            'subject' => $extra['subject'] ?? null,
            'chapter_no' => $extra['chapter_no'] ?? null,
            'chapter_name' => $extra['chapter_name'] ?? null,
            'pdf_name' => $extra['pdf_name'] ?? null,
            'material_attachment' => $extra['material_attachment'] ?? null,
        ]);
    }

    public function upsert(?array $chapterJson, array $materialJson, array $meta = []): array
    {
        $pdo = Database::pdo($this->baseDir);
        $pdo->beginTransaction();

        try {
            $chapterId = null;
            if (is_array($chapterJson)) {
                // Shared db_ai.chapters is Laravel schema (subject_id, name, slug).
                // Link by name/subject; do not overwrite that table with Material AI columns.
                $chapterId = $this->resolveCatalogChapterId($pdo, $meta, $chapterJson);
            }

            $materialId = $this->upsertMaterial($pdo, $chapterId, $materialJson, $meta);
            $this->syncTopics($pdo, $materialId, $materialJson, $meta['topics_meta'] ?? null);

            $pdo->commit();

            return $this->getMaterial($materialId, true);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    public function listMaterials(int $limit = 50, ?int $userId = null, ?string $standard = null, bool $withTopics = false): array
    {
        $pdo = Database::pdo($this->baseDir);
        $limit = max(1, min(200, $limit));
        $sql = "SELECT id, chapter_id, user_id, slug, title, medium, standard, subject, chapter_no, chapter_name,
                    status, topics_total, topics_done,
                    material_json_name, html_name, material_attachment, created_at, updated_at
             FROM materials
             WHERE 1=1";
        $params = [];
        if ($userId !== null && $userId > 0) {
            $sql .= ' AND user_id = ?';
            $params[] = $userId;
        }
        if ($standard !== null && $standard !== '') {
            $sql .= ' AND (
                TRIM(standard) = ?
                OR TRIM(standard) = ?
                OR TRIM(standard) = ?
                OR TRIM(standard) REGEXP ?
            )';
            $params[] = $standard;
            $params[] = 'Std ' . $standard;
            $params[] = 'Standard ' . $standard;
            // Match "Std 11", "11", "Standard-11" but not "16" when looking for "6"
            $params[] = '(^|[^0-9])' . preg_quote($standard, '/') . '([^0-9]|$)';
        }
        $sql .= " ORDER BY
            subject ASC,
            CAST(chapter_no AS UNSIGNED) ASC,
            chapter_no ASC,
            updated_at DESC
            LIMIT {$limit}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        if (!$withTopics || !$items) {
            return $items;
        }

        $ids = array_map(static fn ($row) => (int) $row['id'], $items);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $topicStmt = $pdo->prepare(
            "SELECT material_id, topic_order, topic_key, title, title_gu, generated, updated_at
             FROM material_topics
             WHERE material_id IN ({$placeholders})
             ORDER BY material_id ASC, topic_order ASC"
        );
        $topicStmt->execute($ids);
        $byMaterial = [];
        foreach ($topicStmt->fetchAll() as $topic) {
            $mid = (int) $topic['material_id'];
            unset($topic['material_id']);
            $byMaterial[$mid][] = $topic;
        }
        foreach ($items as &$item) {
            $item['topics'] = $byMaterial[(int) $item['id']] ?? [];
        }
        unset($item);

        return $items;
    }

    public function getMaterial(int|string $idOrSlug, bool $includeJson = true): ?array
    {
        $pdo = Database::pdo($this->baseDir);
        if (is_numeric($idOrSlug)) {
            $stmt = $pdo->prepare('SELECT * FROM materials WHERE id = ? LIMIT 1');
            $stmt->execute([(int) $idOrSlug]);
        } else {
            $stmt = $pdo->prepare('SELECT * FROM materials WHERE slug = ? LIMIT 1');
            $stmt->execute([(string) $idOrSlug]);
        }
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $topics = $pdo->prepare(
            'SELECT topic_order, topic_key, title, title_gu, generated, updated_at
             FROM material_topics WHERE material_id = ? ORDER BY topic_order ASC'
        );
        $topics->execute([(int) $row['id']]);
        $row['topics'] = $topics->fetchAll();

        if (!$includeJson) {
            unset($row['material_json']);
        } else {
            $row['material'] = json_decode((string) $row['material_json'], true);
        }

        return $row;
    }

    public function getChapter(int|string $idOrSlug, bool $includeJson = true): ?array
    {
        $pdo = Database::pdo($this->baseDir);
        if (is_numeric($idOrSlug)) {
            $stmt = $pdo->prepare('SELECT * FROM chapters WHERE id = ? LIMIT 1');
            $stmt->execute([(int) $idOrSlug]);
        } else {
            $stmt = $pdo->prepare('SELECT * FROM chapters WHERE slug = ? LIMIT 1');
            $stmt->execute([(string) $idOrSlug]);
        }
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        if (!$includeJson) {
            unset($row['chapter_json']);
        } else {
            $row['chapter'] = json_decode((string) $row['chapter_json'], true);
        }
        return $row;
    }

    /**
     * Resolve chapter id from shared catalog table (Laravel chapters).
     */
    private function resolveCatalogChapterId(PDO $pdo, array $meta, array $chapterJson = []): ?int
    {
        $cmeta = $chapterJson['meta'] ?? [];
        $name = trim((string) ($meta['chapter_name'] ?? ($cmeta['chapter_name'] ?? ($cmeta['title'] ?? ''))));
        $subject = trim((string) ($meta['subject'] ?? ($cmeta['subject'] ?? '')));
        if ($name === '') {
            return null;
        }

        if ($subject !== '') {
            $stmt = $pdo->prepare(
                'SELECT c.id
                 FROM chapters c
                 INNER JOIN subjects s ON s.id = c.subject_id
                 WHERE c.is_active = 1 AND c.name = ? AND s.name = ?
                 LIMIT 1'
            );
            $stmt->execute([$name, $subject]);
        } else {
            $stmt = $pdo->prepare(
                'SELECT id FROM chapters WHERE is_active = 1 AND name = ? LIMIT 1'
            );
            $stmt->execute([$name]);
        }

        $id = $stmt->fetchColumn();
        return $id !== false ? (int) $id : null;
    }

    private function upsertChapter(PDO $pdo, array $chapterJson, ?string $fileName, array $meta = []): int
    {
        // Kept for compatibility; catalog chapters are linked via resolveCatalogChapterId().
        $id = $this->resolveCatalogChapterId($pdo, $meta, $chapterJson);
        if ($id) {
            return $id;
        }
        throw new RuntimeException('Chapter not found in catalog. Select a chapter from the list.');
    }

    private function upsertMaterial(PDO $pdo, ?int $chapterId, array $materialJson, array $meta): int
    {
        $m = $materialJson['meta'] ?? [];
        $slug = (string) ($m['id'] ?? ($meta['material_json_name'] ? pathinfo((string) $meta['material_json_name'], PATHINFO_FILENAME) : 'material'));
        $slug = preg_replace('/-material-ai$/', '', $slug) ?: $slug;

        $topicsTotal = (int) ($m['planned_sections'] ?? count($materialJson['topic_plans'] ?? []));
        $topicsDone = (int) ($m['total_sections'] ?? count($materialJson['sections'] ?? []));
        $status = (string) ($m['generation_status'] ?? ($topicsDone >= $topicsTotal && $topicsTotal > 0 ? 'complete' : 'partial'));

        $json = json_encode($materialJson, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new RuntimeException('Failed to encode material JSON');
        }

        $title = $meta['chapter_name'] ?? ($m['chapter_name'] ?? ($m['title'] ?? null));
        $medium = $meta['medium'] ?? ($m['medium'] ?? null);
        $standard = $meta['standard'] ?? ($m['standard'] ?? null);
        $subject = $meta['subject'] ?? ($m['subject'] ?? null);
        $chapterNo = $meta['chapter_no'] ?? ($m['chapter_no'] ?? null);
        $chapterName = $meta['chapter_name'] ?? ($m['chapter_name'] ?? $title);
        $userId = $meta['user_id'] ?? null;
        $attachment = $meta['material_attachment'] ?? null;

        $stmt = $pdo->prepare(
            'INSERT INTO materials
              (chapter_id, user_id, slug, title, medium, standard, subject, chapter_no, chapter_name,
               status, topics_total, topics_done, material_json_name, material_json, html_name, material_attachment)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               chapter_id = VALUES(chapter_id),
               user_id = COALESCE(VALUES(user_id), user_id),
               title = VALUES(title),
               medium = VALUES(medium),
               standard = VALUES(standard),
               subject = VALUES(subject),
               chapter_no = VALUES(chapter_no),
               chapter_name = VALUES(chapter_name),
               status = VALUES(status),
               topics_total = VALUES(topics_total),
               topics_done = VALUES(topics_done),
               material_json_name = VALUES(material_json_name),
               material_json = VALUES(material_json),
               html_name = VALUES(html_name),
               material_attachment = COALESCE(VALUES(material_attachment), material_attachment),
               updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            $chapterId,
            $userId,
            $slug,
            $title,
            $medium,
            $standard,
            $subject,
            $chapterNo,
            $chapterName,
            $status,
            $topicsTotal,
            $topicsDone,
            $meta['material_json_name'] ?? null,
            $json,
            $meta['html_name'] ?? null,
            $attachment,
        ]);

        $idStmt = $pdo->prepare('SELECT id FROM materials WHERE slug = ? LIMIT 1');
        $idStmt->execute([$slug]);
        return (int) $idStmt->fetchColumn();
    }

    private function syncTopics(PDO $pdo, int $materialId, array $materialJson, ?array $topicsMeta): void
    {
        $plans = $materialJson['topic_plans'] ?? [];
        if (!$plans && is_array($topicsMeta)) {
            $plans = $topicsMeta;
        }

        $sectionsByOrder = [];
        foreach ($materialJson['sections'] ?? [] as $section) {
            $order = (int) ($section['order'] ?? 0);
            if ($order > 0) {
                $sectionsByOrder[$order] = $section;
            }
        }

        $generatedOrders = $materialJson['meta']['generated_topic_orders'] ?? array_keys($sectionsByOrder);
        $generatedSet = [];
        foreach ($generatedOrders as $o) {
            $generatedSet[(int) $o] = true;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO material_topics
              (material_id, topic_order, topic_key, title, title_gu, generated, section_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               topic_key = VALUES(topic_key),
               title = VALUES(title),
               title_gu = VALUES(title_gu),
               generated = VALUES(generated),
               section_json = VALUES(section_json),
               updated_at = CURRENT_TIMESTAMP'
        );

        foreach ($plans as $plan) {
            $order = (int) ($plan['order'] ?? 0);
            if ($order < 1) {
                continue;
            }
            $section = $sectionsByOrder[$order] ?? null;
            $sectionJson = $section ? json_encode($section, JSON_UNESCAPED_UNICODE) : null;
            $generated = isset($generatedSet[$order]) || !empty($plan['generated']) || $section !== null;

            $stmt->execute([
                $materialId,
                $order,
                $plan['id'] ?? ($plan['topic_key'] ?? null),
                $plan['title'] ?? ($section['title'] ?? null),
                $plan['title_gu'] ?? ($section['title_gu'] ?? null),
                $generated ? 1 : 0,
                $sectionJson,
            ]);
        }
    }
}
