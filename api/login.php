<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__);
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'Auth.php';

Auth::startSession();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = Auth::currentUser();
    echo json_encode([
        'success' => true,
        'logged_in' => $user !== null,
        'user' => $user,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST or GET required']);
    exit;
}

$action = trim((string) ($_POST['action'] ?? 'login'));

try {
    if ($action === 'logout') {
        Auth::logout();
        echo json_encode(['success' => true, 'logged_in' => false]);
        exit;
    }

    $username = trim((string) ($_POST['username'] ?? $_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    if ($username === '' || $password === '') {
        throw new RuntimeException('Email and password are required');
    }

    $user = Auth::login($baseDir, $username, $password);
    echo json_encode([
        'success' => true,
        'logged_in' => true,
        'user' => $user,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
