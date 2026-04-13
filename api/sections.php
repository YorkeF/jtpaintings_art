<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDb();

if ($method === 'GET') {
    $sections = $db->query('SELECT * FROM sections ORDER BY sort_order ASC, name ASC')->fetchAll();
    foreach ($sections as &$section) {
        $stmt = $db->prepare('SELECT * FROM images WHERE section_id = ? ORDER BY sort_order ASC, title ASC');
        $stmt->execute([$section['id']]);
        $section['images'] = $stmt->fetchAll();
    }
    jsonResponse($sections);
}

// Unsectioned images (section_id IS NULL)
if ($method === 'GET' && ($_GET['unsectioned'] ?? false)) {
    $stmt = $db->query('SELECT * FROM images WHERE section_id IS NULL ORDER BY sort_order ASC, title ASC');
    jsonResponse($stmt->fetchAll());
}

jsonResponse(['error' => 'Method not allowed'], 405);
