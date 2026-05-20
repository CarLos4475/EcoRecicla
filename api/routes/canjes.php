<?php

$method = $_SERVER['REQUEST_METHOD'];

$db = getDB();

switch ($method) {
    case 'POST':
        $input = getJsonInput();
        $required = ['usuario_id', 'recompensa_id'];
        foreach ($required as $field) {
            if (empty($input[$field])) errorResponse("Campo '{$field}' es requerido");
        }

        $stmt = $db->prepare("SELECT * FROM recompensas WHERE id = ? AND activo = true");
        $stmt->execute([$input['recompensa_id']]);
        $recompensa = $stmt->fetch();
        if (!$recompensa) errorResponse('Recompensa no disponible', 404);

        $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$input['usuario_id']]);
        $usuario = $stmt->fetch();
        if (!$usuario) errorResponse('Usuario no encontrado', 404);

        if ($usuario['ecopuntos'] < $recompensa['costo_puntos']) {
            errorResponse('Puntos insuficientes', 400);
        }

        $code = 'ECO-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("UPDATE usuarios SET ecopuntos = ecopuntos - ? WHERE id = ?");
            $stmt->execute([$recompensa['costo_puntos'], $input['usuario_id']]);

            $stmt = $db->prepare("INSERT INTO canjes (usuario_id, recompensa_id, puntos_usados, codigo_canje) VALUES (?, ?, ?, ?)");
            $stmt->execute([$input['usuario_id'], $input['recompensa_id'], $recompensa['costo_puntos'], $code]);

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('Error al procesar el canje', 500);
        }

        jsonResponse([
            'message' => 'Canje exitoso',
            'codigo_canje' => $code,
            'recompensa' => $recompensa['nombre'],
            'puntos_usados' => $recompensa['costo_puntos'],
            'saldo_restante' => $usuario['ecopuntos'] - $recompensa['costo_puntos'],
        ], 201);

    default:
        errorResponse('Método no permitido', 405);
}
