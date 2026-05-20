<?php
/**
 * EcoRecicla — Front Controller
 * Handles API routing for Render (nginx + PHP-FPM).
 * Static files (index.html, styles.css, app.js) are served directly by nginx.
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route API requests → api/index.php
if (strpos($uri, '/api/') === 0) {
    require __DIR__ . '/api/index.php';
    return;
}

// Route root → index.html
if ($uri === '/' || $uri === '') {
    readfile(__DIR__ . '/index.html');
    return;
}

// Try to serve existing static file
$file = __DIR__ . $uri;
if (is_file($file)) {
    return false;
}

// Fallback → index.html (anchor links)
readfile(__DIR__ . '/index.html');
