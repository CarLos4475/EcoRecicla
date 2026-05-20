-- EcoRecicla — Schema para PostgreSQL / Supabase
-- Ejecutar en SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    delegacion VARCHAR(100) NOT NULL,
    ecopuntos INTEGER NOT NULL DEFAULT 0,
    kg_reciclados DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    co2_evitado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario'
        CHECK (rol IN ('usuario', 'operador', 'administrador')),
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS puntos_verdes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(300) NOT NULL,
    delegacion VARCHAR(100) NOT NULL,
    horario VARCHAR(100) NOT NULL,
    materiales_aceptados JSONB NOT NULL DEFAULT '[]',
    acepta_electronicos BOOLEAN NOT NULL DEFAULT false,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'mantenimiento', 'cerrado'))
);

CREATE TABLE IF NOT EXISTS entregas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    punto_verde_id INTEGER NOT NULL,
    material_tipo VARCHAR(20) NOT NULL
        CHECK (material_tipo IN ('plastico', 'vidrio', 'papel', 'metal', 'organico', 'electronico')),
    cantidad DECIMAL(10,2) NOT NULL,
    puntos_otorgados INTEGER NOT NULL DEFAULT 0,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'acreditado', 'rechazado')),
    operador_id INTEGER DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS recompensas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    costo_puntos INTEGER NOT NULL,
    categoria VARCHAR(20) NOT NULL
        CHECK (categoria IN ('alimentos', 'descuento', 'transporte', 'ambiental')),
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_expiracion DATE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS canjes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    recompensa_id INTEGER NOT NULL,
    puntos_usados INTEGER NOT NULL,
    codigo_canje VARCHAR(20) NOT NULL UNIQUE,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promociones (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('promocion', 'evento', 'novedad')),
    fecha_inicio DATE DEFAULT NULL,
    fecha_fin DATE DEFAULT NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- Seed data
INSERT INTO usuarios (nombre, apellido, email, password_hash, delegacion, ecopuntos, kg_reciclados, co2_evitado, rol) VALUES
('María', 'García', 'maria@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Coyoacán', 320, 12.50, 8.20, 'usuario'),
('Carlos', 'López', 'carlos@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Del Valle', 180, 7.30, 4.80, 'usuario'),
('Ana', 'Martínez', 'ana@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Polanco', 450, 18.10, 12.00, 'usuario'),
('Roberto', 'Hernández', 'roberto@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Xochimilco', 95, 3.20, 2.10, 'usuario'),
('Admin', 'Sistema', 'admin@ecorecicla.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'CDMX', 0, 0, 0, 'administrador');

INSERT INTO puntos_verdes (nombre, direccion, delegacion, horario, materiales_aceptados, acepta_electronicos, estado) VALUES
('PV Coyoacán', 'Av. Universidad 1234', 'Coyoacán', 'Lun–Sáb 8–18h', '["plastico","vidrio","papel","metal","electronico"]', true, 'activo'),
('PV Del Valle', 'Insurgentes Sur 567', 'Del Valle', 'Lun–Sáb 7–19h', '["plastico","vidrio","papel","metal","organico","electronico"]', true, 'activo'),
('PV Polanco', 'Av. Homero 890', 'Polanco', 'Lun–Vie 9–17h', '["plastico","vidrio","papel","metal"]', false, 'activo'),
('PV Xochimilco', 'Calz. de las Flores 123', 'Xochimilco', 'Lun–Sáb 8–16h', '["plastico","papel","organico","electronico"]', true, 'activo'),
('PV Tlalpan', 'Av. Insurgentes Sur 2345', 'Tlalpan', 'Lun–Sáb 8–18h', '["plastico","vidrio","papel","metal","organico"]', false, 'activo'),
('PV Iztapalapa', 'Av. Tláhuac 456', 'Iztapalapa', '—', '[]', false, 'mantenimiento');

INSERT INTO entregas (usuario_id, punto_verde_id, material_tipo, cantidad, puntos_otorgados, fecha, estado, operador_id) VALUES
(1, 1, 'plastico', 500, 25, '2026-05-10 10:00:00', 'acreditado', 5),
(1, 1, 'vidrio', 300, 12, '2026-05-12 11:30:00', 'acreditado', 5),
(2, 2, 'metal', 200, 16, '2026-05-13 09:15:00', 'pendiente', 5),
(3, 3, 'electronico', 2, 40, '2026-05-14 14:00:00', 'acreditado', 5),
(4, 4, 'organico', 1000, 20, '2026-05-15 08:45:00', 'rechazado', 5);

INSERT INTO recompensas (nombre, descripcion, costo_puntos, categoria) VALUES
('Café gratis', 'Café americano o espresso en cafeterías participantes de Coyoacán y Del Valle', 50, 'alimentos'),
('Descuento Metrobús', 'Viaje gratis en Metrobús. Válido en todas las líneas.', 80, 'transporte'),
('Kit de compostaje', 'Kit básico para iniciar compostaje en casa', 120, 'ambiental'),
('Smoothie verde', 'Smoothie orgánico en juguerías participantes', 35, 'alimentos'),
('20% en tienda eco', 'Descuento en tienda de productos sustentables', 200, 'descuento'),
('Árbol plantado', 'Participa en el programa de reforestación de CDMX', 150, 'ambiental');

INSERT INTO promociones (titulo, descripcion, tipo, fecha_inicio, fecha_fin) VALUES
('Doble puntos en electrónicos', 'Durante todo mayo, acumula el doble de puntos en electrónicos RAEE', 'promocion', '2026-05-01', '2026-05-31'),
('Jornada de reciclaje Xochimilco', 'Evento comunitario de reciclaje el 15 de junio en Xochimilco', 'evento', '2026-06-15', '2026-06-15'),
('CDMX recicla 8.4 toneladas', 'Récord histórico en el primer trimestre de 2026', 'novedad', '2026-04-01', NULL);
