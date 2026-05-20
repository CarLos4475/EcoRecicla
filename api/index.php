<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';

$method = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();

$resource = $segments[0] ?? '';

switch ($resource) {
    case 'usuarios':
        require __DIR__ . '/routes/usuarios.php';
        break;
    case 'entregas':
        require __DIR__ . '/routes/entregas.php';
        break;
    case 'puntos_verdes':
        require __DIR__ . '/routes/puntos_verdes.php';
        break;
    case 'recompensas':
        require __DIR__ . '/routes/recompensas.php';
        break;
    case 'canjes':
        require __DIR__ . '/routes/canjes.php';
        break;
    case 'auth':
        require __DIR__ . '/routes/auth.php';
        break;
    case 'admin':
        require __DIR__ . '/routes/admin.php';
        break;
    default:
        errorResponse('Recurso no encontrado', 404);
}
