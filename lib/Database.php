<?php
declare(strict_types=1);

final class Database
{
    private static ?PDO $pdo = null;

    public static function loadConfig(string $baseDir): array
    {
        $path = $baseDir . DIRECTORY_SEPARATOR . 'config.json';
        $file = [];
        if (is_file($path)) {
            $decoded = json_decode((string) file_get_contents($path), true);
            if (is_array($decoded)) {
                $file = $decoded;
            }
        }

        $db = $file['mysql'] ?? [];

        return [
            'enabled' => ($db['enabled'] ?? true) !== false,
            'host' => getenv('MYSQL_HOST') ?: ($db['host'] ?? '127.0.0.1'),
            'port' => (int) (getenv('MYSQL_PORT') ?: ($db['port'] ?? 3306)),
            'database' => getenv('MYSQL_DATABASE') ?: ($db['database'] ?? 'material_ai'),
            'username' => getenv('MYSQL_USERNAME') ?: ($db['username'] ?? 'root'),
            'password' => getenv('MYSQL_PASSWORD') !== false && getenv('MYSQL_PASSWORD') !== ''
                ? (string) getenv('MYSQL_PASSWORD')
                : (string) ($db['password'] ?? ''),
            'charset' => $db['charset'] ?? 'utf8mb4',
        ];
    }

    public static function pdo(string $baseDir): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $cfg = self::loadConfig($baseDir);
        if (empty($cfg['enabled'])) {
            throw new RuntimeException('MySQL is disabled in config.json (mysql.enabled=false).');
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $cfg['host'],
            $cfg['port'],
            $cfg['database'],
            $cfg['charset']
        );

        self::$pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$pdo;
    }
}
