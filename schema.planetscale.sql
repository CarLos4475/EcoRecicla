-- EcoRecicla — Schema para PlanetScale (sin foreign keys)
-- Las FK se manejan en la capa de aplicación.

CREATE TABLE IF NOT EXISTS usuarios (
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
);

CREATE TABLE IF NOT EXISTS puntos_verdes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(300) NOT NULL,
    delegacion VARCHAR(100) NOT NULL,
    horario VARCHAR(100) NOT NULL,
    materiales_aceptados JSON NOT NULL,
    acepta_electronicos TINYINT(1) NOT NULL DEFAULT 0,
    estado ENUM('activo', 'mantenimiento', 'cerrado') NOT NULL DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    punto_verde_id INT NOT NULL,
    material_tipo ENUM('plastico', 'vidrio', 'papel', 'metal', 'organico', 'electronico') NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    puntos_otorgados INT NOT NULL DEFAULT 0,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'acreditado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    operador_id INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS recompensas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    costo_puntos INT NOT NULL,
    categoria ENUM('alimentos', 'descuento', 'transporte', 'ambiental') NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_expiracion DATE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS canjes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    recompensa_id INT NOT NULL,
    puntos_usados INT NOT NULL,
    codigo_canje VARCHAR(20) NOT NULL UNIQUE,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promociones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo ENUM('promocion', 'evento', 'novedad') NOT NULL,
    fecha_inicio DATE DEFAULT NULL,
    fecha_fin DATE DEFAULT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1
);
