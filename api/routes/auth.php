<?php

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch ($method) {
    case 'POST':
        $input = getJsonInput();
        if (($input['user'] ?? '') !== 'admin' || ($input['pass'] ?? '') !== 'eco2024') {
            errorResponse('Credenciales incorrectas', 401);
        }
        jsonResponse(['message' => 'Login exitoso', 'token' => 'admin-token']);

    default:
        errorResponse('Método no permitido', 405);
}
