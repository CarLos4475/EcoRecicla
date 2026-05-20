<?php

$method = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();
$id = $segments[1] ?? null;

$db = getDB();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT e.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido,
                                  pv.nombre as punto_verde_nombre
                                  FROM entregas e
                                  LEFT JOIN usuarios u ON e.usuario_id = u.id
                                  LEFT JOIN puntos_verdes pv ON e.punto_verde_id = pv.id
                                  WHERE e.id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) errorResponse('Entrega no encontrada', 404);
            jsonResponse($row);
        }

        $usuarioId = $_GET['usuario_id'] ?? null;
        if ($usuarioId) {
            $stmt = $db->prepare("SELECT e.*, pv.nombre as punto_verde_nombre
                                  FROM entregas e
                                  LEFT JOIN puntos_verdes pv ON e.punto_verde_id = pv.id
                                  WHERE e.usuario_id = ?
                                  ORDER BY e.fecha DESC");
            $stmt->execute([$usuarioId]);
        } else {
            $stmt = $db->query("SELECT e.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido,
                                pv.nombre as punto_verde_nombre
                                FROM entregas e
                                LEFT JOIN usuarios u ON e.usuario_id = u.id
                                LEFT JOIN puntos_verdes pv ON e.punto_verde_id = pv.id
                                ORDER BY e.fecha DESC");
        }
        jsonResponse($stmt->fetchAll());

    case 'POST':
        $input = getJsonInput();
        $required = ['usuario_id', 'punto_verde_id', 'material_tipo', 'cantidad'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || $input[$field] === '') {
                errorResponse("Campo '{$field}' es requerido");
            }
        }

        $validMaterials = ['plastico', 'vidrio', 'papel', 'metal', 'organico', 'electronico'];
        if (!in_array($input['material_tipo'], $validMaterials)) {
            errorResponse('Tipo de material inválido');
        }

        $pointsPer = ['plastico' => 5, 'vidrio' => 4, 'papel' => 3, 'metal' => 8, 'organico' => 2, 'electronico' => 20];
        $pts = $input['material_tipo'] === 'electronico'
            ? (int)$input['cantidad'] * $pointsPer[$input['material_tipo']]
            : floor((float)$input['cantidad'] / 100) * $pointsPer[$input['material_tipo']];

        $operadorId = $input['operador_id'] ?? null;

        $stmt = $db->prepare("INSERT INTO entregas (usuario_id, punto_verde_id, material_tipo, cantidad, puntos_otorgados, estado, operador_id)
                              VALUES (?, ?, ?, ?, ?, 'pendiente', ?)");
        $stmt->execute([$input['usuario_id'], $input['punto_verde_id'], $input['material_tipo'], $input['cantidad'], $pts, $operadorId]);

        $newId = $db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM entregas WHERE id = ?");
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);

    case 'PUT':
        if (!$id) errorResponse('ID requerido', 400);
        $input = getJsonInput();

        $validStatuses = ['pendiente', 'acreditado', 'rechazado'];
        if (!empty($input['estado']) && !in_array($input['estado'], $validStatuses)) {
            errorResponse('Estado inválido');
        }

        if (!empty($input['estado']) && $input['estado'] === 'acreditado') {
            $stmt = $db->prepare("SELECT * FROM entregas WHERE id = ?");
            $stmt->execute([$id]);
            $delivery = $stmt->fetch();
            if ($delivery) {
                $kgFactor = ['plastico' => 2.5, 'vidrio' => 1.8, 'papel' => 1.2, 'metal' => 3.0, 'organico' => 0.5, 'electronico' => 4.0];
                $material = $delivery['material_tipo'];
                $kg = $material === 'electronico' ? $delivery['cantidad'] * 0.5 : (float)$delivery['cantidad'] / 1000;
                $co2 = $kg * ($kgFactor[$material] ?? 1.0);

                $db->prepare("UPDATE usuarios SET ecopuntos = ecopuntos + ?, kg_reciclados = kg_reciclados + ?, co2_evitado = co2_evitado + ? WHERE id = ?")
                   ->execute([$delivery['puntos_otorgados'], $kg, $co2, $delivery['usuario_id']]);
            }
        }

        $stmt = $db->prepare("UPDATE entregas SET estado = ? WHERE id = ?");
        $stmt->execute([$input['estado'], $id]);

        $stmt = $db->prepare("SELECT e.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido FROM entregas e LEFT JOIN usuarios u ON e.usuario_id = u.id WHERE e.id = ?");
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());

    case 'DELETE':
        if (!$id) errorResponse('ID requerido', 400);
        $stmt = $db->prepare("DELETE FROM entregas WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) errorResponse('Entrega no encontrada', 404);
        jsonResponse(['message' => 'Entrega eliminada']);

    default:
        errorResponse('Método no permitido', 405);
}
