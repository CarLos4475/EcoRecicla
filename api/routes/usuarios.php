<?php

$method = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();
$id = $segments[1] ?? null;

$db = getDB();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            if (!$user) {
                errorResponse('Usuario no encontrado', 404);
            }
            unset($user['password_hash']);
            jsonResponse($user);
        }

        $email = $_GET['email'] ?? '';
        if ($email) {
            $stmt = $db->prepare("SELECT * FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            if (!$user) {
                errorResponse('Usuario no encontrado', 404);
            }
            unset($user['password_hash']);
            jsonResponse($user);
        }

        $stmt = $db->query("SELECT * FROM usuarios ORDER BY id");
        $users = $stmt->fetchAll();
        $users = array_map(function($u) { unset($u['password_hash']); return $u; }, $users);
        jsonResponse($users);

    case 'POST':
        $input = getJsonInput();
        $required = ['nombre', 'apellido', 'email', 'password', 'delegacion'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                errorResponse("Campo '{$field}' es requerido");
            }
        }

        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            errorResponse('Email inválido');
        }

        $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            errorResponse('El email ya está registrado');
        }

        $hash = password_hash($input['password'], PASSWORD_BCRYPT);

        $stmt = $db->prepare("INSERT INTO usuarios (nombre, apellido, email, password_hash, delegacion, rol) VALUES (?, ?, ?, ?, ?, 'usuario')");
        $stmt->execute([$input['nombre'], $input['apellido'], $input['email'], $hash, $input['delegacion']]);

        $newId = $db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$newId]);
        $user = $stmt->fetch();
        unset($user['password_hash']);
        jsonResponse($user, 201);

    case 'PUT':
        if (!$id) errorResponse('ID requerido', 400);
        $input = getJsonInput();

        $fields = [];
        $params = [];
        foreach (['nombre', 'apellido', 'email', 'delegacion', 'ecopuntos', 'kg_reciclados', 'co2_evitado', 'activo'] as $f) {
            if (isset($input[$f])) {
                $fields[] = "{$f} = ?";
                $params[] = $input[$f];
            }
        }

        if (empty($fields)) errorResponse('Sin campos para actualizar', 400);

        $params[] = $id;
        $stmt = $db->prepare("UPDATE usuarios SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);

        $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) errorResponse('Usuario no encontrado', 404);
        unset($user['password_hash']);
        jsonResponse($user);

    case 'DELETE':
        if (!$id) errorResponse('ID requerido', 400);
        $stmt = $db->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) errorResponse('Usuario no encontrado', 404);
        jsonResponse(['message' => 'Usuario eliminado']);

    default:
        errorResponse('Método no permitido', 405);
}
