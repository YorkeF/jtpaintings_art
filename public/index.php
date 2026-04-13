<?php
// CORS headers for local dev (Vite dev server)
if ($_SERVER['HTTP_HOST'] === 'localhost' || str_contains($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1')) {
    header('Access-Control-Allow-Origin: http://localhost:5173');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (str_starts_with($path, '/api/')) {
    // Route /api/{resource}[/{id}] to the appropriate PHP file
    $segment = explode('/', trim($path, '/'))[1] ?? ''; // e.g. "sections", "images", "upload", "auth"
    $apiFile = dirname(__DIR__) . '/api/' . $segment . '.php';
    if (file_exists($apiFile)) {
        require $apiFile;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
    }
    exit;
}

// Serve static files that actually exist (images, JS, CSS, etc.)
$staticFile = __DIR__ . $path;
if ($path !== '/' && file_exists($staticFile) && is_file($staticFile)) {
    return false; // Let the web server handle it (Apache/Nginx)
}

// Everything else → React app
$indexFile = __DIR__ . '/dist/index.html';
if (file_exists($indexFile)) {
    readfile($indexFile);
} else {
    http_response_code(503);
    echo '<h1>Frontend not built</h1><p>Run <code>npm run build</code> to generate the frontend.</p>';
}
