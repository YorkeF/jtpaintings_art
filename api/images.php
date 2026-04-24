<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDb();

// ID passed as ?id=42 query param (path-based routing not available on nginx without rewrites)
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM images WHERE id = ?');
        $stmt->execute([$id]);
        $image = $stmt->fetch();
        $image ? jsonResponse($image) : jsonResponse(['error' => 'Not found'], 404);
    }
    if (isset($_GET['unsectioned'])) {
        $stmt = $db->query('SELECT * FROM images WHERE section_id IS NULL ORDER BY sort_order ASC, title ASC');
    } elseif (isset($_GET['section_id'])) {
        $stmt = $db->prepare('SELECT * FROM images WHERE section_id = ? ORDER BY sort_order ASC, title ASC');
        $stmt->execute([(int) $_GET['section_id']]);
    } else {
        $stmt = $db->query('SELECT * FROM images ORDER BY section_id ASC, sort_order ASC, title ASC');
    }
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare('INSERT INTO images (section_id, title, description, image_path, sort_order) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([
        $body['section_id'] ?? null,
        $body['title'],
        $body['description'] ?? '',
        $body['image_path'],
        $body['sort_order'] ?? 0,
    ]);
    jsonResponse(['id' => $db->lastInsertId()], 201);
}

if ($method === 'PUT' && $id) {
    requireAdmin();
    $body    = json_decode(file_get_contents('php://input'), true);
    $colSpan   = isset($body['col_span']) ? max(1, min(20, (int) $body['col_span'])) : 1;
    $rowSpan   = isset($body['row_span']) ? max(1, min(6, (int) $body['row_span'])) : 1;
    $gridRow   = (isset($body['grid_row']) && $body['grid_row'] !== null && $body['grid_row'] !== '')
        ? max(1, (int) $body['grid_row'])
        : null;
    $allowed   = ['cover', 'contain', 'fill', 'scale-down', 'none'];
    $objectFit = in_array($body['object_fit'] ?? '', $allowed) ? $body['object_fit'] : 'cover';
    $arMode    = !empty($body['ar_mode']) ? 1 : 0;
    $arW       = isset($body['ar_w']) ? max(1, (int) $body['ar_w']) : 16;
    $arH       = isset($body['ar_h']) ? max(1, (int) $body['ar_h']) : 9;
    $arSize    = isset($body['ar_size']) ? max(0.1, round((float) $body['ar_size'], 2)) : 1.0;
    $stmt = $db->prepare('UPDATE images SET title = ?, description = ?, section_id = ?, sort_order = ?, col_span = ?, row_span = ?, grid_row = ?, object_fit = ?, ar_mode = ?, ar_w = ?, ar_h = ?, ar_size = ? WHERE id = ?');
    $stmt->execute([
        $body['title'],
        $body['description'] ?? '',
        $body['section_id'] ?? null,
        $body['sort_order'] ?? 0,
        $colSpan,
        $rowSpan,
        $gridRow,
        $objectFit,
        $arMode,
        $arW,
        $arH,
        $arSize,
        $id,
    ]);
    jsonResponse(['success' => true]);
}

if ($method === 'DELETE' && $id) {
    requireAdmin();
    $stmt = $db->prepare('SELECT image_path FROM images WHERE id = ?');
    $stmt->execute([$id]);
    $image = $stmt->fetch();
    if (!$image) jsonResponse(['error' => 'Not found'], 404);

    // Delete file from filesystem
    $filePath = WEB_ROOT . '/' . ltrim($image['image_path'], '/');
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    $db->prepare('DELETE FROM images WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
