<?php
declare(strict_types=1);

/**
 * Database config loading order:
 * 1) Environment variables (recommended on hosting panel)
 * 2) Optional local config file path from PG_CONFIG_FILE
 * 3) Optional private file outside web root: ../../private/pg-config.php
 */
function loadDbConfig(): array
{
    $config = [
        'host' => getenv('PG_HOST') ?: null,
        'port' => getenv('PG_PORT') ?: '5432',
        'name' => getenv('PG_DB') ?: null,
        'user' => getenv('PG_USER') ?: null,
        'pass' => getenv('PG_PASS') ?: null,
        'sslmode' => getenv('PG_SSLMODE') ?: 'require',
    ];

    $allFromEnv = $config['host'] && $config['name'] && $config['user'] !== null;
    if ($allFromEnv) {
        return $config;
    }

    $candidateFiles = [];
    $customConfigFile = getenv('PG_CONFIG_FILE');
    if (is_string($customConfigFile) && $customConfigFile !== '') {
        $candidateFiles[] = $customConfigFile;
    }
    $candidateFiles[] = __DIR__ . '/../../private/pg-config.php';

    foreach ($candidateFiles as $file) {
        if (!is_file($file)) {
            continue;
        }
        $loaded = require $file;
        if (!is_array($loaded)) {
            continue;
        }
        $config = array_merge($config, $loaded);
        break;
    }

    foreach (['host', 'name', 'user'] as $requiredKey) {
        if (empty($config[$requiredKey])) {
            throw new RuntimeException('Configuracao de banco incompleta.');
        }
    }

    return $config;
}

function getPdo(): PDO
{
    $dsnOverride = getenv('PG_DSN');
    if (is_string($dsnOverride) && $dsnOverride !== '') {
        return new PDO(
            $dsnOverride,
            getenv('PG_USER') ?: null,
            getenv('PG_PASS') ?: null,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    }

    $cfg = loadDbConfig();
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
        $cfg['host'],
        $cfg['port'],
        $cfg['name'],
        $cfg['sslmode']
    );

    return new PDO(
        $dsn,
        (string) $cfg['user'],
        (string) ($cfg['pass'] ?? ''),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
}
