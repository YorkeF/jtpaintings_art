<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDb();
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($method === 'GET') {
    $sections = $db->query('SELECT * FROM sections ORDER BY sort_order ASC, name ASC')->fetchAll();
    foreach ($sections as &$section) {
        $stmt = $db->prepare('SELECT * FROM images WHERE section_id = ? ORDER BY sort_order ASC, title ASC');
        $stmt->execute([$section['id']]);
        $section['images'] = $stmt->fetchAll();
    }
    jsonResponse($sections);
}

if ($method === 'POST') {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true);
    $name = trim($body['name'] ?? '');
    if ($name === '') jsonResponse(['error' => 'Name is required'], 400);
    $slug = slugify($name);
    $stmt = $db->prepare('INSERT INTO sections (name, slug) VALUES (?, ?)');
    $stmt->execute([$name, $slug]);
    jsonResponse(['id' => (int) $db->lastInsertId(), 'name' => $name, 'slug' => $slug], 201);
}

if ($method === 'PUT' && $id) {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true);

    if (array_key_exists('supersection_id', $body)) {
        $supId = ($body['supersection_id'] !== null && $body['supersection_id'] !== '')
            ? (int) $body['supersection_id']
            : null;
        $db->prepare('UPDATE sections SET supersection_id = ? WHERE id = ?')->execute([$supId, $id]);
    }

    if (array_key_exists('name', $body)) {
        $name = trim($body['name']);
        if ($name === '') jsonResponse(['error' => 'Name is required'], 400);
        // Only update display name — slug stays fixed so existing image paths don't break
        $db->prepare('UPDATE sections SET name = ? WHERE id = ?')->execute([$name, $id]);
    }

    jsonResponse(['success' => true]);
}

if ($method === 'DELETE' && $id) {
    requireAdmin();
    $body        = json_decode(file_get_contents('php://input'), true) ?? [];
    $deleteImages = !empty($body['delete_images']);

    if ($deleteImages) {
        // Delete image files from disk, then rows
        $images = $db->prepare('SELECT image_path FROM images WHERE section_id = ?');
        $images->execute([$id]);
        foreach ($images->fetchAll() as $img) {
            $file = WEB_ROOT . $img['image_path'];
            if (file_exists($file)) unlink($file);
            // Remove thumbnail if it exists
            $thumb = preg_replace('/(\.[^.]+)$/', '_thumb.jpg', $file);
            if ($thumb !== $file && file_exists($thumb)) unlink($thumb);
        }
        $db->prepare('DELETE FROM images WHERE section_id = ?')->execute([$id]);
    } else {
        $db->prepare('UPDATE images SET section_id = NULL WHERE section_id = ?')->execute([$id]);
    }

    $db->prepare('DELETE FROM sections WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
