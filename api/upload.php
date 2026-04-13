<?php
require_once __DIR__ . '/config.php';

// Each section batch can have large images — give PHP enough time
set_time_limit(120);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

requireAdmin();

$db = getDb();
$uploadBase = WEB_ROOT . '/uploads';

// Files come in as $_FILES['files'] with multiple entries.
// Each file's relative path is sent as $_POST['paths'][n].
$files = $_FILES['files'] ?? null;
$paths = $_POST['paths'] ?? [];

if (!$files || empty($files['name'])) {
    jsonResponse(['error' => 'No files uploaded'], 400);
}

// Normalise $_FILES array into a list of [ tmp, name, path ]
$fileList = [];
for ($i = 0; $i < count($files['name']); $i++) {
    if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
    $fileList[] = [
        'tmp'  => $files['tmp_name'][$i],
        'name' => $files['name'][$i],
        'path' => $paths[$i] ?? $files['name'][$i],
    ];
}

// Group files by (section, basename) so we can pair images with .txt files.
// Path format: TopFolder/SectionName/filename  OR  TopFolder/filename
// Top-level folder is stripped; immediate subfolder = section name.
$sectionMap  = []; // slug => section row
$imageFiles  = []; // ['section_slug' => slug|null, 'basename' => ..., 'tmp' => ...]
$textFiles   = []; // ['section_slug' => slug|null, 'basename' => ..., 'content' => ...]

// HEIC files are converted to JPEG client-side before upload, so only standard types arrive here
$allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

foreach ($fileList as $f) {
    $relPath = str_replace('\\', '/', $f['path']);
    $parts   = explode('/', $relPath);

    // Strip top-level folder (the folder the user selected)
    array_shift($parts);

    if (count($parts) === 0) continue;

    $sectionName = null;
    $filename    = null;

    if (count($parts) === 1) {
        // File directly in root → no section
        $filename = $parts[0];
    } else {
        // Immediate subfolder = section; flatten deeper nesting into that section
        $sectionName = $parts[0];
        $filename    = end($parts);
    }

    $ext      = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $basename = pathinfo($filename, PATHINFO_FILENAME);
    $slug     = $sectionName ? slugify($sectionName) : null;

    if ($sectionName && $slug && !isset($sectionMap[$slug])) {
        $sectionMap[$slug] = ['name' => $sectionName, 'slug' => $slug];
    }

    if ($ext === 'txt') {
        $textFiles[] = ['section_slug' => $slug, 'basename' => $basename, 'content' => file_get_contents($f['tmp'])];
    } elseif (in_array($ext, $allowedImageTypes)) {
        $imageFiles[] = ['section_slug' => $slug, 'basename' => $basename, 'ext' => $ext, 'tmp' => $f['tmp'], 'original_name' => $filename];
    }
}

// Build description lookup: [section_slug.basename] => description
$descLookup = [];
foreach ($textFiles as $t) {
    $key = ($t['section_slug'] ?? '__root__') . '.' . strtolower($t['basename']);
    $descLookup[$key] = trim($t['content']);
}

// Upsert sections
$sectionIds = []; // slug => id
foreach ($sectionMap as $slug => $s) {
    $stmt = $db->prepare('INSERT INTO sections (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');
    $stmt->execute([$s['name'], $slug]);
    $sectionIds[$slug] = $db->lastInsertId();
}

// Process images
$inserted = 0;
$errors   = [];
foreach ($imageFiles as $img) {
    $slug      = $img['section_slug'];
    $sectionId = $slug ? ($sectionIds[$slug] ?? null) : null;

    // Build destination path
    $destDir = $uploadBase . ($slug ? '/' . $slug : '');
    if (!is_dir($destDir)) {
        mkdir($destDir, 0775, true);
    }

    // Avoid collisions
    $destFilename = $img['basename'] . '.' . $img['ext'];
    $destPath     = $destDir . '/' . $destFilename;
    $counter      = 1;
    while (file_exists($destPath)) {
        $destFilename = $img['basename'] . '_' . $counter++ . '.' . $img['ext'];
        $destPath     = $destDir . '/' . $destFilename;
    }

    if (!move_uploaded_file($img['tmp'], $destPath)) {
        $errors[] = 'Failed to save ' . $img['original_name'];
        continue;
    }

    $webPath = '/uploads' . ($slug ? '/' . $slug : '') . '/' . $destFilename;
    $title   = ucwords(str_replace(['-', '_'], ' ', $img['basename']));

    $descKey     = ($slug ?? '__root__') . '.' . strtolower($img['basename']);
    $description = $descLookup[$descKey] ?? '';

    $stmt = $db->prepare('INSERT INTO images (section_id, title, description, image_path) VALUES (?, ?, ?, ?)');
    $stmt->execute([$sectionId, $title, $description, $webPath]);
    $inserted++;
}

jsonResponse(['inserted' => $inserted, 'errors' => $errors]);
