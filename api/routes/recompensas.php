<?php

$method = $_SERVER['REQUEST_METHOD'];

$db = getDB();

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM recompensas WHERE activo = true ORDER BY costo_puntos ASC");
        jsonResponse($stmt->fetchAll());

    default:
        errorResponse('Método no permitido', 405);
}
