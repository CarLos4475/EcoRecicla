CREATE DATABASE IF NOT EXISTS ecorecicla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecorecicla;

DROP TABLE IF EXISTS canjes;
DROP TABLE IF EXISTS promociones;
DROP TABLE IF EXISTS recompensas;
DROP TABLE IF EXISTS entregas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS puntos_verdes;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    delegacion VARCHAR(100) NOT NULL,
    ecopuntos INT NOT NULL DEFAULT 0,
    kg_reciclados DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    co2_evitado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rol ENUM('usuario', 'operador', 'administrador') NOT NULL DEFAULT 'usuario',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE puntos_verdes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(300) NOT NULL,
    delegacion VARCHAR(100) NOT NULL,
    horario VARCHAR(100) NOT NULL,
    materiales_aceptados JSON NOT NULL,
    acepta_electronicos TINYINT(1) NOT NULL DEFAULT 0,
    estado ENUM('activo', 'mantenimiento', 'cerrado') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB;

CREATE TABLE entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    punto_verde_id INT NOT NULL,
    material_tipo ENUM('plastico', 'vidrio', 'papel', 'metal', 'organico', 'electronico') NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    puntos_otorgados INT NOT NULL DEFAULT 0,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'acreditado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    operador_id INT DEFAULT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (punto_verde_id) REFERENCES puntos_verdes(id) ON DELETE CASCADE,
    FOREIGN KEY (operador_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE recompensas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    costo_puntos INT NOT NULL,
    categoria ENUM('alimentos', 'descuento', 'transporte', 'ambiental') NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_expiracion DATE DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE canjes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    recompensa_id INT NOT NULL,
    puntos_usados INT NOT NULL,
    codigo_canje VARCHAR(20) NOT NULL UNIQUE,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (recompensa_id) REFERENCES recompensas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE promociones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo ENUM('promocion', 'evento', 'novedad') NOT NULL,
    fecha_inicio DATE DEFAULT NULL,
    fecha_fin DATE DEFAULT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Seed data

INSERT INTO usuarios (nombre, apellido, email, password_hash, delegacion, ecopuntos, kg_reciclados, co2_evitado, rol, activo) VALUES
('María', 'García', 'maria@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Coyoacán', 320, 12.50, 8.20, 'usuario', 1),
('Carlos', 'López', 'carlos@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Del Valle', 180, 7.30, 4.80, 'usuario', 1),
('Ana', 'Martínez', 'ana@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Polanco', 450, 18.10, 12.00, 'usuario', 1),
('Roberto', 'Hernández', 'roberto@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Xochimilco', 95, 3.20, 2.10, 'usuario', 1),
('Admin', 'Sistema', 'admin@ecorecicla.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'CDMX', 0, 0, 0, 'administrador', 1);

INSERT INTO puntos_verdes (nombre, direccion, delegacion, horario, materiales_aceptados, acepta_electronicos, estado) VALUES
('PV Coyoacán', 'Av. Universidad 1234', 'Coyoacán', 'Lun–Sáb 8–18h', '["plastico","vidrio","papel","metal","electronico"]', 1, 'activo'),
('PV Del Valle', 'Insurgentes Sur 567', 'Del Valle', 'Lun–Sáb 7–19h', '["plastico","vidrio","papel","metal","organico","electronico"]', 1, 'activo'),
('PV Polanco', 'Av. Homero 890', 'Polanco', 'Lun–Vie 9–17h', '["plastico","vidrio","papel","metal"]', 0, 'activo'),
('PV Xochimilco', 'Calz. de las Flores 123', 'Xochimilco', 'Lun–Sáb 8–16h', '["plastico","papel","organico","electronico"]', 1, 'activo'),
('PV Tlalpan', 'Av. Insurgentes Sur 2345', 'Tlalpan', 'Lun–Sáb 8–18h', '["plastico","vidrio","papel","metal","organico"]', 0, 'activo'),
('PV Iztapalapa', 'Av. Tláhuac 456', 'Iztapalapa', '—', '[]', 0, 'mantenimiento');

INSERT INTO entregas (usuario_id, punto_verde_id, material_tipo, cantidad, puntos_otorgados, fecha, estado, operador_id) VALUES
(1, 1, 'plastico', 500, 25, '2026-05-10 10:00:00', 'acreditado', 5),
(1, 1, 'vidrio', 300, 12, '2026-05-12 11:30:00', 'acreditado', 5),
(2, 2, 'metal', 200, 16, '2026-05-13 09:15:00', 'pendiente', 5),
(3, 3, 'electronico', 2, 40, '2026-05-14 14:00:00', 'acreditado', 5),
(4, 4, 'organico', 1000, 20, '2026-05-15 08:45:00', 'rechazado', 5);

INSERT INTO recompensas (nombre, descripcion, costo_puntos, categoria, activo) VALUES
('Café gratis', 'Café americano o espresso en cafeterías participantes de Coyoacán y Del Valle', 50, 'alimentos', 1),
('Descuento Metrobús', 'Viaje gratis en Metrobús. Válido en todas las líneas.', 80, 'transporte', 1),
('Kit de compostaje', 'Kit básico para iniciar compostaje en casa', 120, 'ambiental', 1),
('Smoothie verde', 'Smoothie orgánico en juguerías participantes', 35, 'alimentos', 1),
('20% en tienda eco', 'Descuento en tienda de productos sustentables', 200, 'descuento', 1),
('Árbol plantado', 'Participa en el programa de reforestación de CDMX', 150, 'ambiental', 1);

INSERT INTO promociones (titulo, descripcion, tipo, fecha_inicio, fecha_fin, activo) VALUES
('Doble puntos en electrónicos', 'Durante todo mayo, acumula el doble de puntos en electrónicos RAEE', 'promocion', '2026-05-01', '2026-05-31', 1),
('Jornada de reciclaje Xochimilco', 'Evento comunitario de reciclaje el 15 de junio en Xochimilco', 'evento', '2026-06-15', '2026-06-15', 1),
('CDMX recicla 8.4 toneladas', 'Récord histórico en el primer trimestre de 2026', 'novedad', '2026-04-01', NULL, 1);
