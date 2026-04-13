<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDb();

if ($method === 'GET') {
    requireAdmin();
    $rows = $db->query('SELECT `key`, `value` FROM settings')->fetchAll();
    $out  = [];
    foreach ($rows as $row) {
        $out[$row['key']] = $row['value'];
    }
    jsonResponse($out);
}

if ($method === 'PUT') {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    foreach ($body as $key => $value) {
        $key   = trim($key);
        $value = trim($value);
        if ($key === '') continue;
        $db->prepare('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)')
           ->execute([$key, $value]);
    }
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
