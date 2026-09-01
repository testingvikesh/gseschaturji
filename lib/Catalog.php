<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

/**
 * Helpers for shared catalog tables (standards / subjects).
 */
final class Catalog
{
    public static function ensureSubject(string $baseDir, string $standardValue, string $subjectName): array
    {
        $pdo = Database::pdo($baseDir);
        $subjectName = trim($subjectName);
        if ($subjectName === '') {
            throw new RuntimeException('Subject name is required');
        }

        $standardId = self::resolveStandardId($pdo, $standardValue);
        if ($standardId < 1) {
            throw new RuntimeException('Standard not found: ' . $standardValue);
        }

        $stmt = $pdo->prepare(
            'SELECT id, standard_id, name, slug
             FROM subjects
             WHERE standard_id = ? AND (name = ? OR slug = ?)
             LIMIT 1'
        );
        $slug = self::slugify($subjectName);
        $stmt->execute([$standardId, $subjectName, $slug]);
        $existing = $stmt->fetch();
        if ($existing) {
            return [
                'id' => (int) $existing['id'],
                'standard_id' => (int) $existing['standard_id'],
                'name' => (string) $existing['name'],
                'slug' => (string) $existing['slug'],
                'created' => false,
            ];
        }

        $sort = (int) $pdo->query(
            'SELECT COALESCE(MAX(sort_order), 0) + 1 FROM subjects WHERE standard_id = ' . (int) $standardId
        )->fetchColumn();

        $ins = $pdo->prepare(
            'INSERT INTO subjects (standard_id, name, slug, sort_order, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, NOW(), NOW())'
        );
        $ins->execute([$standardId, $subjectName, $slug, $sort]);

        return [
            'id' => (int) $pdo->lastInsertId(),
            'standard_id' => $standardId,
            'name' => $subjectName,
            'slug' => $slug,
            'created' => true,
        ];
    }

    public static function resolveStandardId(PDO $pdo, string $standardValue): int
    {
        $raw = trim($standardValue);
        if ($raw === '') {
            return 0;
        }

        $num = null;
        if (preg_match('/(\d{1,2})/', $raw, $m)) {
            $num = (int) $m[1];
        }

        if (ctype_digit($raw)) {
            $stmt = $pdo->prepare(
                'SELECT id FROM standards
                 WHERE is_active = 1 AND (id = ? OR sort_order = ?)
                 LIMIT 1'
            );
            $stmt->execute([(int) $raw, (int) $raw]);
            $id = (int) ($stmt->fetchColumn() ?: 0);
            if ($id > 0) {
                return $id;
            }
        }

        $candidates = [
            $raw,
            'standard_' . ($num ?? $raw),
            'std' . ($num ?? $raw),
            'Standard ' . ($num ?? $raw),
            'Std ' . ($num ?? $raw),
        ];
        $placeholders = implode(',', array_fill(0, count($candidates), '?'));
        $stmt = $pdo->prepare(
            "SELECT id FROM standards
             WHERE is_active = 1 AND (slug IN ($placeholders) OR name IN ($placeholders))
             LIMIT 1"
        );
        $stmt->execute([...$candidates, ...$candidates]);
        $id = (int) ($stmt->fetchColumn() ?: 0);
        if ($id > 0) {
            return $id;
        }

        if ($num !== null) {
            $stmt = $pdo->prepare(
                'SELECT id FROM standards WHERE is_active = 1 AND sort_order = ? LIMIT 1'
            );
            $stmt->execute([$num]);
            return (int) ($stmt->fetchColumn() ?: 0);
        }

        return 0;
    }

    public static function slugify(string $text): string
    {
        $text = mb_strtolower(trim($text), 'UTF-8');
        $text = preg_replace('/[^\p{L}\p{N}]+/u', '-', $text) ?? $text;
        return trim($text, '-') ?: 'subject';
    }
}
