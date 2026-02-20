<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

function sendJson(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function setCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = getenv('ALLOWED_ORIGINS') ?: '';
    $allowedOrigins = array_filter(array_map('trim', explode(',', $allowed)));

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}

function validateCep(string $cep): bool
{
    return (bool) preg_match('/^\d{8}$/', $cep);
}

setCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = getPdo();
} catch (Throwable $e) {
    sendJson(500, ['ok' => false, 'error' => 'Erro interno.']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $limitRaw = $_GET['limit'] ?? '20';
    $limit = (int) $limitRaw;
    if ($limit < 1 || $limit > 100) {
        sendJson(400, ['ok' => false, 'error' => 'Parametro limit invalido.']);
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT id, cep, logradouro, bairro, cidade, estado, consultado_em
             FROM cep_history
             ORDER BY consultado_em DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        sendJson(200, ['ok' => true, 'items' => $items]);
    } catch (Throwable $e) {
        sendJson(500, ['ok' => false, 'error' => 'Erro interno.']);
    }
}

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput ?: '', true);

    if (!is_array($decoded)) {
        sendJson(400, ['ok' => false, 'error' => 'JSON invalido.']);
    }

    $cep = isset($decoded['cep']) ? preg_replace('/\D/', '', (string) $decoded['cep']) : '';
    $logradouro = isset($decoded['logradouro']) ? (string) $decoded['logradouro'] : null;
    $bairro = isset($decoded['bairro']) ? (string) $decoded['bairro'] : null;
    $cidade = isset($decoded['cidade']) ? (string) $decoded['cidade'] : null;
    $estado = isset($decoded['estado']) ? strtoupper((string) $decoded['estado']) : null;
    $fonte = isset($decoded['fonte']) ? (string) $decoded['fonte'] : 'viacep';

    if (!validateCep($cep)) {
        sendJson(400, ['ok' => false, 'error' => 'CEP invalido.']);
    }

    if ($estado !== null && $estado !== '' && !preg_match('/^[A-Z]{2}$/', $estado)) {
        sendJson(400, ['ok' => false, 'error' => 'Estado invalido.']);
    }

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO cep_history (cep, logradouro, bairro, cidade, estado, fonte)
             VALUES (:cep, :logradouro, :bairro, :cidade, :estado, :fonte)
             RETURNING id'
        );

        $stmt->bindValue(':cep', $cep, PDO::PARAM_STR);
        $stmt->bindValue(':logradouro', $logradouro, $logradouro === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':bairro', $bairro, $bairro === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':cidade', $cidade, $cidade === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':estado', $estado, $estado === null || $estado === '' ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':fonte', $fonte, PDO::PARAM_STR);
        $stmt->execute();
        $id = (int) $stmt->fetchColumn();

        sendJson(201, ['ok' => true, 'id' => $id]);
    } catch (Throwable $e) {
        sendJson(500, ['ok' => false, 'error' => 'Erro interno.']);
    }
}

sendJson(405, ['ok' => false, 'error' => 'Metodo nao permitido.']);
