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

// API requests are served directly by nginx as www/api/*.php — no routing needed here.
// Static files (uploads, assets) are served directly by nginx.

// Everything else → React app
// On the server, index.html is at the web root; locally it's in dist/
$indexFile = file_exists(__DIR__ . '/index.html')
    ? __DIR__ . '/index.html'
    : __DIR__ . '/dist/index.html';
if (file_exists($indexFile)) {
    readfile($indexFile);
} else {
    http_response_code(503);
    echo '<h1>Frontend not built</h1><p>Run <code>npm run build</code> to generate the frontend.</p>';
}
