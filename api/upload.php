<?php
require_once __DIR__ . '/config.php';

set_time_limit(60);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

requireAdmin();

$db         = getDb();
$uploadBase = WEB_ROOT . '/uploads';

// Accepts one image at a time.
// $_FILES['file']      — the image
// $_POST['path']       — webkitRelativePath (used to determine section)
// $_POST['description'] — pre-read from the paired .txt file by the client

$file = $_FILES['file'] ?? null;
$path = trim($_POST['path'] ?? '');

if (!$file || !isset($file['error'])) {
    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 'unknown';
    $postMax       = ini_get('post_max_size');
    $uploadMax     = ini_get('upload_max_filesize');
    jsonResponse(['error' => "No file received. post_max_size=$postMax, upload_max_filesize=$uploadMax, request=$contentLength bytes"], 400);
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    $phpErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds upload_max_filesize (' . ini_get('upload_max_filesize') . ')',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file part in request',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp directory',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write to disk',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by a PHP extension',
    ];
    jsonResponse(['error' => $phpErrors[$file['error']] ?? "PHP upload error code {$file['error']}"], 400);
}

if ($path === '') {
    jsonResponse(['error' => 'No file path received — webkitRelativePath may be empty'], 400);
}

// HEIC files are converted client-side; only standard types should arrive
$allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

// Parse section and filename from path: TopFolder/SectionName/file.jpg
$parts = explode('/', str_replace('\\', '/', $path));
array_shift($parts); // strip the top-level upload folder name

$filename    = end($parts);
$sectionName = count($parts) > 1 ? $parts[0] : null;
$ext         = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$basename    = pathinfo($filename, PATHINFO_FILENAME);
$slug        = $sectionName ? slugify($sectionName) : null;

if (!in_array($ext, $allowedTypes)) {
    jsonResponse(['error' => "File type .$ext not allowed"], 400);
}

// Upsert section (ON DUPLICATE KEY is safe for concurrent single-file uploads)
$sectionId = null;
if ($slug) {
    $stmt = $db->prepare('INSERT INTO sections (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');
    $stmt->execute([$sectionName, $slug]);
    $sectionId = $db->lastInsertId();
}

// Save file, avoiding collisions
$destDir = $uploadBase . ($slug ? '/' . $slug : '');
if (!is_dir($destDir)) {
    mkdir($destDir, 0775, true);
}

$destFilename = $basename . '.' . $ext;
$destPath     = $destDir . '/' . $destFilename;
$counter      = 1;
while (file_exists($destPath)) {
    $destFilename = $basename . '_' . $counter++ . '.' . $ext;
    $destPath     = $destDir . '/' . $destFilename;
}

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonResponse(['error' => "Failed to save $filename"], 500);
}

$webPath     = '/uploads' . ($slug ? '/' . $slug : '') . '/' . $destFilename;
$title       = ucwords(str_replace(['-', '_'], ' ', $basename));
$description = trim($_POST['description'] ?? '');

$stmt = $db->prepare('INSERT INTO images (section_id, title, description, image_path) VALUES (?, ?, ?, ?)');
$stmt->execute([$sectionId, $title, $description, $webPath]);

jsonResponse(['id' => $db->lastInsertId()]);
