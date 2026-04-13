<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($action === 'check') {
    jsonResponse(['authenticated' => !empty($_SESSION['admin'])]);
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    jsonResponse(['success' => true]);
}

if ($action === 'login' && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $password = $body['password'] ?? '';
    $adminPassword = $_ENV['ADMIN_PASSWORD'] ?? '';

    if ($adminPassword && password_verify($password, $adminPassword)) {
        $_SESSION['admin'] = true;
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Invalid password'], 401);
    }
}

jsonResponse(['error' => 'Not found'], 404);
