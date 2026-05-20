<?php

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $driver = getenv('DB_DRIVER') ?: 'mysql';
        $host   = getenv('DB_HOST') ?: '127.0.0.1';
        $port   = getenv('DB_PORT') ?: ($driver === 'pgsql' ? '5432' : '3306');
        $db     = getenv('DB_NAME') ?: ($driver === 'pgsql' ? 'ecorecicla' : 'ecorecicla');
        $user   = getenv('DB_USER') ?: 'root';
        $pass   = getenv('DB_PASS') ?: 'eco2024';

        if ($driver === 'pgsql') {
            $ssl = getenv('DB_SSL') ?: 'require';
            $dsn = "pgsql:host={$host};port={$port};dbname={$db};sslmode={$ssl}";
        } else {
            $ssl = getenv('DB_SSL') ?: 'false';
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        }

        $opts = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        // PostgreSQL needs emulated prepares for ?-style placeholders
        if ($driver === 'pgsql') {
            $opts[PDO::ATTR_EMULATE_PREPARES] = true;
        } else {
            $opts[PDO::ATTR_EMULATE_PREPARES] = false;
            if ($ssl === 'true' || $ssl === '1') {
                $opts[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }
        }

        $pdo = new PDO($dsn, $user, $pass, $opts);
    }
    return $pdo;
}
