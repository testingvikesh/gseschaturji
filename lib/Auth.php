<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

/**
 * Login against shared users table (Laravel-style):
 * id, name, email, mobile, role, is_approved, password, standard, ...
 */
final class Auth
{
    /** Roles allowed to use Material AI Generator */
    private const ALLOWED_ROLES = ['admin', 'teacher'];

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start([
                'cookie_httponly' => true,
                'cookie_samesite' => 'Lax',
            ]);
        }
    }

    public static function loadAuthConfig(string $baseDir): array
    {
        $path = $baseDir . DIRECTORY_SEPARATOR . 'config.json';
        $file = [];
        if (is_file($path)) {
            $decoded = json_decode((string) file_get_contents($path), true);
            if (is_array($decoded)) {
                $file = $decoded;
            }
        }
        $auth = $file['auth'] ?? [];
        return [
            'username' => (string) ($auth['username'] ?? 'admin'),
            'password' => (string) ($auth['password'] ?? 'admin123'),
        ];
    }

    public static function requireLogin(string $baseDir): array
    {
        self::startSession();
        if (empty($_SESSION['user_id']) || empty($_SESSION['username'])) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Login required', 'login_required' => true], JSON_UNESCAPED_UNICODE);
            exit;
        }
        return self::sessionUser();
    }

    public static function currentUser(): ?array
    {
        self::startSession();
        if (empty($_SESSION['user_id'])) {
            return null;
        }
        return self::sessionUser();
    }

    private static function sessionUser(): array
    {
        return [
            'id' => (int) $_SESSION['user_id'],
            'username' => (string) ($_SESSION['username'] ?? ''),
            'email' => (string) ($_SESSION['email'] ?? ''),
            'role' => (string) ($_SESSION['role'] ?? ''),
            'standard' => (string) ($_SESSION['standard'] ?? ''),
        ];
    }

    /** @return list<string> */
    private static function usersColumns(PDO $pdo): array
    {
        static $cols = null;
        if (is_array($cols)) {
            return $cols;
        }
        $cols = [];
        $stmt = $pdo->query('SHOW COLUMNS FROM users');
        foreach ($stmt as $r) {
            $cols[] = (string) $r['Field'];
        }
        return $cols;
    }

    public static function login(string $baseDir, string $login, string $password): array
    {
        self::startSession();
        $pdo = Database::pdo($baseDir);
        $login = trim($login);
        $cols = self::usersColumns($pdo);

        $select = ['id'];
        foreach (['name', 'username', 'email', 'mobile', 'role', 'is_approved', 'password', 'password_hash', 'standard'] as $c) {
            if (in_array($c, $cols, true)) {
                $select[] = $c;
            }
        }

        $where = [];
        $params = [];
        foreach (['email', 'mobile', 'name', 'username'] as $c) {
            if (in_array($c, $cols, true)) {
                $where[] = "{$c} = ?";
                $params[] = $login;
            }
        }
        if (!$where) {
            throw new RuntimeException('Users table has no login columns (email/name/username)');
        }

        $sql = 'SELECT ' . implode(', ', $select) . ' FROM users WHERE ' . implode(' OR ', $where) . ' LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();

        $hash = (string) ($row['password'] ?? $row['password_hash'] ?? '');
        if (!$row || $hash === '' || !password_verify($password, $hash)) {
            throw new RuntimeException('Invalid email or password');
        }

        if (array_key_exists('is_approved', $row) && !(int) $row['is_approved']) {
            throw new RuntimeException('Account is not approved yet');
        }

        $role = strtolower(trim((string) ($row['role'] ?? 'admin')));
        if ($role !== '' && !in_array($role, self::ALLOWED_ROLES, true)) {
            throw new RuntimeException('Only admin or teacher accounts can use this tool');
        }

        $displayName = trim((string) (
            ($row['name'] ?? '')
            ?: ($row['username'] ?? '')
            ?: ($row['email'] ?? '')
            ?: $login
        ));
        $standard = self::normalizeStandardValue((string) ($row['standard'] ?? ''));

        $_SESSION['user_id'] = (int) $row['id'];
        $_SESSION['username'] = $displayName;
        $_SESSION['email'] = (string) ($row['email'] ?? '');
        $_SESSION['role'] = $role;
        $_SESSION['standard'] = $standard;

        return [
            'id' => (int) $row['id'],
            'username' => $displayName,
            'email' => (string) ($row['email'] ?? ''),
            'role' => $role,
            'standard' => $standard,
        ];
    }

    /**
     * Normalize users.standard → "9" style value used by the form.
     * Accepts: "9", "Std 9", "standard_9", "Standard 9"
     */
    public static function normalizeStandardValue(string $raw): string
    {
        $raw = trim($raw);
        if ($raw === '' || strcasecmp($raw, 'null') === 0) {
            return '';
        }
        if (preg_match('/(\d{1,2})/', $raw, $m)) {
            return (string) (int) $m[1];
        }
        return $raw;
    }

    public static function logout(): void
    {
        self::startSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], (bool) $p['secure'], (bool) $p['httponly']);
        }
        session_destroy();
    }

    public static function ensureDefaultUser(string $baseDir): void
    {
        // Shared users table — do not seed.
    }
}
