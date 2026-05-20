<?php
// Router for `php -S localhost:8000 router.php`
// Forwards all requests to the front controller (index.php)

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri !== '/' && is_file(__DIR__ . $uri)) {
    return false;
}

require __DIR__ . '/index.php';
