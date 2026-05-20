<?php

$method = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();
$id = $segments[1] ?? null;

$db = getDB();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM puntos_verdes WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) errorResponse('Punto verde no encontrado', 404);
            jsonResponse($row);
        }

        $stmt = $db->query("SELECT * FROM puntos_verdes ORDER BY id");
        jsonResponse($stmt->fetchAll());

    case 'POST':
        $input = getJsonInput();
        $required = ['nombre', 'direccion', 'delegacion', 'horario'];
        foreach ($required as $field) {
            if (empty($input[$field])) errorResponse("Campo '{$field}' es requerido");
        }

        $stmt = $db->prepare("INSERT INTO puntos_verdes (nombre, direccion, delegacion, horario, materiales_aceptados, acepta_electronicos, estado)
                              VALUES (?, ?, ?, ?, ?, ?, ?)");
        $materiales = json_encode($input['materiales_aceptados'] ?? ['plastico', 'papel']);
        $stmt->execute([
            $input['nombre'], $input['direccion'], $input['delegacion'],
            $input['horario'], $materiales,
            $input['acepta_electronicos'] ?? false,
            $input['estado'] ?? 'activo'
        ]);

        $newId = $db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM puntos_verdes WHERE id = ?");
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);

    case 'PUT':
        if (!$id) errorResponse('ID requerido', 400);
        $input = getJsonInput();

        $fields = [];
        $params = [];
        foreach (['nombre', 'direccion', 'delegacion', 'horario', 'estado'] as $f) {
            if (isset($input[$f])) {
                $fields[] = "{$f} = ?";
                $params[] = $input[$f];
            }
        }
        if (isset($input['acepta_electronicos'])) {
            $fields[] = "acepta_electronicos = ?";
            $params[] = $input['acepta_electronicos'];
        }
        if (isset($input['materiales_aceptados'])) {
            $fields[] = "materiales_aceptados = ?";
            $params[] = json_encode($input['materiales_aceptados']);
        }

        if (empty($fields)) errorResponse('Sin campos para actualizar', 400);

        $params[] = $id;
        $stmt = $db->prepare("UPDATE puntos_verdes SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);

        $stmt = $db->prepare("SELECT * FROM puntos_verdes WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());

    case 'DELETE':
        if (!$id) errorResponse('ID requerido', 400);
        $stmt = $db->prepare("DELETE FROM puntos_verdes WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) errorResponse('Punto verde no encontrado', 404);
        jsonResponse(['message' => 'Punto verde eliminado']);

    default:
        errorResponse('Método no permitido', 405);
}
