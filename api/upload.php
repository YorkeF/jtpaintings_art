<?php
require_once __DIR__ . '/config.php';

// ── Thumbnail generation ───────────────────────────────────────────────────────
// Saves {basename}_thumb.jpg alongside the original at max 900px wide, quality 80.
// Silently skips if GD is unavailable or the format isn't supported.
function generateThumbnail(string $srcPath, string $destDir, string $basename, string $ext): void
{
    if (!extension_loaded('gd')) return;

    $creators = [
        'jpg'  => 'imagecreatefromjpeg',
        'jpeg' => 'imagecreatefromjpeg',
        'png'  => 'imagecreatefrompng',
        'gif'  => 'imagecreatefromgif',
        'webp' => 'imagecreatefromwebp',
        'avif' => function_exists('imagecreatefromavif') ? 'imagecreatefromavif' : null,
    ];

    $creator = $creators[$ext] ?? null;
    if (!$creator || !function_exists($creator)) return;

    $src = @$creator($srcPath);
    if (!$src) return;

    $origW = imagesx($src);
    $origH = imagesy($src);
    $maxW  = 900;

    if ($origW > $maxW) {
        $newW  = $maxW;
        $newH  = (int) round($origH * ($maxW / $origW));
        $thumb = imagescale($src, $newW, $newH, IMG_BICUBIC);
    } else {
        // Image already fits — still save a JPEG copy so the frontend can rely on the convention
        $thumb = $src;
        $src   = null; // avoid double-destroy
    }

    if ($thumb) {
        imagejpeg($thumb, $destDir . '/' . $basename . '_thumb.jpg', 80);
        imagedestroy($thumb);
    }
    if ($src) imagedestroy($src);
}

set_time_limit(60);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

requireAdmin();

$db         = getDb();
$uploadBase = WEB_ROOT . '/uploads';

$file = $_FILES['file'] ?? null;

// ── Validate file ─────────────────────────────────────────────────────────────
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

// HEIC files are converted client-side; only standard types should arrive
$allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

// ── Two upload modes ──────────────────────────────────────────────────────────
// Direct mode: admin adds a single image via the UI — section_id is explicit.
// Path mode:   bulk folder upload — section is derived from the file's relative path.
$directMode = array_key_exists('section_id', $_POST);

if ($directMode) {
    // ── Direct mode ───────────────────────────────────────────────────────────
    $sectionId   = $_POST['section_id'] !== '' ? (int) $_POST['section_id'] : null;
    $title       = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $filename    = $file['name'];
    $ext         = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $basename    = pathinfo($filename, PATHINFO_FILENAME);

    if (!in_array($ext, $allowedTypes)) {
        jsonResponse(['error' => "File type .$ext not allowed"], 400);
    }

    if ($title === '') {
        $title = ucwords(str_replace(['-', '_'], ' ', $basename));
    }

    // Determine upload directory from section slug
    $slug = null;
    if ($sectionId !== null) {
        $stmt = $db->prepare('SELECT slug FROM sections WHERE id = ?');
        $stmt->execute([$sectionId]);
        $slug = $stmt->fetchColumn() ?: null;
    }
} else {
    // ── Path mode (bulk folder upload) ────────────────────────────────────────
    $path = trim($_POST['path'] ?? '');
    if ($path === '') {
        jsonResponse(['error' => 'No file path received — webkitRelativePath may be empty'], 400);
    }

    $description = trim($_POST['description'] ?? '');

    // Parse section and filename: TopFolder/SectionName/file.jpg
    $parts = explode('/', str_replace('\\', '/', $path));
    array_shift($parts); // strip top-level upload folder name

    $filename    = end($parts);
    $sectionName = count($parts) > 1 ? $parts[0] : null;
    $ext         = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $basename    = pathinfo($filename, PATHINFO_FILENAME);
    $slug        = $sectionName ? slugify($sectionName) : null;
    $title       = ucwords(str_replace(['-', '_'], ' ', $basename));

    if (!in_array($ext, $allowedTypes)) {
        jsonResponse(['error' => "File type .$ext not allowed"], 400);
    }

    // Upsert section
    $sectionId = null;
    if ($slug) {
        $stmt = $db->prepare('INSERT INTO sections (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');
        $stmt->execute([$sectionName, $slug]);
        $sectionId = (int) $db->lastInsertId();
    }
}

// ── Save file ─────────────────────────────────────────────────────────────────
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

$webPath = '/uploads' . ($slug ? '/' . $slug : '') . '/' . $destFilename;

// ── Generate thumbnail ────────────────────────────────────────────────────────
generateThumbnail($destPath, $destDir, $basename, $ext);

$stmt = $db->prepare('INSERT INTO images (section_id, title, description, image_path) VALUES (?, ?, ?, ?)');
$stmt->execute([$sectionId, $title, $description, $webPath]);

jsonResponse(['id' => (int) $db->lastInsertId()]);
