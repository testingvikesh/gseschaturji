<?php
declare(strict_types=1);

/**
 * One-time MySQL setup — open in browser after creating empty DB.
 * Creates/upgrades tables and seeds default admin user.
 */
header('Content-Type: text/plain; charset=utf-8');

$baseDir = dirname(__DIR__);
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Database.php';
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Auth.php';

try {
    $pdo = Database::pdo($baseDir);
    $sql = (string) file_get_contents($baseDir . DIRECTORY_SEPARATOR . 'sql' . DIRECTORY_SEPARATOR . 'schema.sql');
    $sql = preg_replace('/^--.*$/m', '', $sql) ?? $sql;
    $parts = array_filter(array_map('trim', explode(';', $sql)));
    foreach ($parts as $part) {
        if ($part !== '') {
            $pdo->exec($part);
        }
    }

    // Upgrade existing installs (ignore errors if column already exists)
    $alters = [
        'ALTER TABLE chapters ADD COLUMN user_id INT UNSIGNED NULL AFTER id',
        'ALTER TABLE chapters ADD COLUMN medium VARCHAR(50) NULL AFTER title',
        'ALTER TABLE chapters ADD COLUMN standard VARCHAR(50) NULL AFTER medium',
        'ALTER TABLE chapters ADD COLUMN subject VARCHAR(255) NULL AFTER standard',
        'ALTER TABLE chapters ADD COLUMN chapter_no VARCHAR(50) NULL AFTER subject',
        'ALTER TABLE chapters ADD COLUMN chapter_name VARCHAR(500) NULL AFTER chapter_no',
        'ALTER TABLE chapters ADD COLUMN pdf_name VARCHAR(500) NULL AFTER source_file',
        'ALTER TABLE materials ADD COLUMN user_id INT UNSIGNED NULL AFTER chapter_id',
        'ALTER TABLE materials ADD COLUMN medium VARCHAR(50) NULL AFTER title',
        'ALTER TABLE materials ADD COLUMN standard VARCHAR(50) NULL AFTER medium',
        'ALTER TABLE materials ADD COLUMN subject VARCHAR(255) NULL AFTER standard',
        'ALTER TABLE materials ADD COLUMN chapter_no VARCHAR(50) NULL AFTER subject',
        'ALTER TABLE materials ADD COLUMN chapter_name VARCHAR(500) NULL AFTER chapter_no',
        'ALTER TABLE materials ADD COLUMN material_attachment VARCHAR(500) NULL AFTER html_name',
    ];
    foreach ($alters as $alter) {
        try {
            $pdo->exec($alter);
        } catch (Throwable $e) {
            // duplicate column / already exists
        }
    }

    Auth::ensureDefaultUser($baseDir);

    echo "OK: tables created/upgraded (chapters, materials, material_topics)\n";
    echo "Login uses existing db_ai.users (email + password). Admin/teacher + is_approved=1 required.\n";
    echo "Open index.php and sign in with your user email.\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo 'ERROR: ' . $e->getMessage() . "\n";
    echo "Create empty database first, then set mysql.* in config.json\n";
}
