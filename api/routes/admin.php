<?php

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

$segments = getPathSegments();
$subResource = $segments[1] ?? null;

switch ($method) {
    case 'GET':
        if ($subResource === 'metrics') {
            $users = $db->query("SELECT COUNT(*) as total FROM usuarios")->fetch()['total'];
            $activeGp = $db->query("SELECT COUNT(*) as total FROM puntos_verdes WHERE estado = 'activo'")->fetch()['total'];
            $deliveries = $db->query("SELECT COUNT(*) as total FROM entregas")->fetch()['total'];
            $tons = $db->query("SELECT COALESCE(SUM(kg_reciclados), 0) as total FROM usuarios")->fetch()['total'];
            $tonsFromDeliveries = $db->query("SELECT COALESCE(SUM(CASE WHEN material_tipo = 'electronico' THEN cantidad * 0.5 ELSE cantidad / 1000 END), 0) as total FROM entregas WHERE estado = 'acreditado'")->fetch()['total'];

            jsonResponse([
                'usuarios' => (int)$users,
                'puntos_verdes' => (int)$activeGp,
                'entregas' => (int)$deliveries,
                'toneladas' => round((float)$tons / 1000 + (float)$tonsFromDeliveries, 1),
            ]);
        }

        if ($subResource === 'export') {
            $type = $segments[2] ?? '';

            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="ecorecicla-' . $type . '-' . date('Y-m-d') . '.csv"');

            $output = fopen('php://output', 'w');

            switch ($type) {
                case 'usuarios':
                    fputcsv($output, ['ID', 'Nombre', 'Apellido', 'Email', 'Delegación', 'Ecopuntos', 'KG Reciclados', 'CO₂ Evitado'], ',', '"', '\\');
                    $rows = $db->query("SELECT id, nombre, apellido, email, delegacion, ecopuntos, kg_reciclados, co2_evitado FROM usuarios");
                    foreach ($rows as $r) fputcsv($output, $r, ',', '"', '\\');
                    break;
                case 'puntos_verdes':
                    fputcsv($output, ['ID', 'Nombre', 'Dirección', 'Delegación', 'Horario', 'Estado'], ',', '"', '\\');
                    $rows = $db->query("SELECT id, nombre, direccion, delegacion, horario, estado FROM puntos_verdes");
                    foreach ($rows as $r) fputcsv($output, $r, ',', '"', '\\');
                    break;
                case 'entregas':
                    fputcsv($output, ['ID', 'Usuario', 'Material', 'Cantidad', 'Puntos', 'Fecha', 'Estado'], ',', '"', '\\');
                    $rows = $db->query("SELECT e.id, CONCAT(u.nombre, ' ', u.apellido) as usuario, e.material_tipo, e.cantidad, e.puntos_otorgados, e.fecha, e.estado
                                        FROM entregas e LEFT JOIN usuarios u ON e.usuario_id = u.id");
                    foreach ($rows as $r) fputcsv($output, $r, ',', '"', '\\');
                    break;
                default:
                    errorResponse('Tipo de exportación inválido', 400);
            }
            fclose($output);
            exit;
        }

        errorResponse('Sub-recurso no encontrado', 404);

    default:
        errorResponse('Método no permitido', 405);
}
