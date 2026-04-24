<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDb();
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($method === 'GET') {
    $supers = $db->query('SELECT * FROM supersections ORDER BY sort_order ASC, name ASC')->fetchAll();
    foreach ($supers as &$super) {
        $stmt = $db->prepare('SELECT * FROM sections WHERE supersection_id = ? ORDER BY sort_order ASC, name ASC');
        $stmt->execute([$super['id']]);
        $sections = $stmt->fetchAll();
        foreach ($sections as &$section) {
            $img = $db->prepare('SELECT * FROM images WHERE section_id = ? ORDER BY sort_order ASC, title ASC');
            $img->execute([$section['id']]);
            $section['images'] = $img->fetchAll();
        }
        $super['sections'] = $sections;
    }
    jsonResponse($supers);
}

if ($method === 'POST') {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true);
    $name = trim($body['name'] ?? '');
    if ($name === '') jsonResponse(['error' => 'Name is required'], 400);
    $slug = slugify($name);
    $db->prepare('INSERT INTO supersections (name, slug) VALUES (?, ?)')->execute([$name, $slug]);
    jsonResponse(['id' => (int) $db->lastInsertId(), 'name' => $name, 'slug' => $slug], 201);
}

if ($method === 'PUT' && $id) {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true);

    if (array_key_exists('name', $body)) {
        $name = trim($body['name']);
        if ($name === '') jsonResponse(['error' => 'Name is required'], 400);
        $db->prepare('UPDATE supersections SET name = ? WHERE id = ?')->execute([$name, $id]);
    }

    if (array_key_exists('sort_order', $body)) {
        $db->prepare('UPDATE supersections SET sort_order = ? WHERE id = ?')->execute([(int) $body['sort_order'], $id]);
    }

    jsonResponse(['success' => true]);
}

if ($method === 'DELETE' && $id) {
    requireAdmin();
    // Unassign child sections — they become standalone
    $db->prepare('UPDATE sections SET supersection_id = NULL WHERE supersection_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM supersections WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
