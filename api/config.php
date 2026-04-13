<?php
// Load .env — one level up from api/ locally, two levels up on server (www/api → www → ~)
$envFile = file_exists(dirname(__DIR__) . '/.env')
    ? dirname(__DIR__) . '/.env'
    : dirname(dirname(__DIR__)) . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

// WEB_ROOT: absolute path to the publicly-served directory.
// API files are served directly by nginx (index.php is never in the call chain),
// so this cannot rely on index.php defining it.
// On the server: api/ lives inside www/  → parent of api/ = www/ (the web root)
// Local dev:     api/ is a sibling of public/ → parent contains a public/ folder
if (!defined('WEB_ROOT')) {
    $parent = dirname(__DIR__);
    define('WEB_ROOT', is_dir($parent . '/public') ? $parent . '/public' : $parent);
}

session_start();

function getDb(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $name = $_ENV['DB_NAME'] ?? 'jtpaintings';
        $user = $_ENV['DB_USER'] ?? 'root';
        $pass = $_ENV['DB_PASS'] ?? '';
        $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function requireAdmin(): void {
    if (empty($_SESSION['admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}

function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function slugify(string $text): string {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-');
}
