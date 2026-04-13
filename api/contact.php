<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body    = json_decode(file_get_contents('php://input'), true) ?? [];
$name    = trim($body['name']    ?? '');
$email   = trim($body['email']   ?? '');
$message = trim($body['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    jsonResponse(['error' => 'All fields are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email address'], 400);
}

$stmt = getDb()->prepare('SELECT `value` FROM settings WHERE `key` = ?');
$stmt->execute(['contact_email']);
$to = $stmt->fetchColumn() ?: '';
if ($to === '') {
    jsonResponse(['error' => 'Contact email not configured'], 500);
}

$subject = 'New message from ' . $name;
$body    = "Name: $name\nEmail: $email\n\n$message";
$headers = implode("\r\n", [
    'From: noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'),
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
]);

if (!mail($to, $subject, $body, $headers)) {
    jsonResponse(['error' => 'Failed to send message. Please try again later.'], 500);
}

jsonResponse(['success' => true]);
