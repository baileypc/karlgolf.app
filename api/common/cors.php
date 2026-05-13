<?php
/**
 * Karl's GIR - CORS Handler
 * Allows only the production app, local development, and Capacitor origins.
 */

function isLocalDevHost($host) {
    if (empty($host) || !is_string($host)) {
        return false;
    }

    $host = strtolower(explode(':', $host)[0]);

    return $host === 'localhost'
        || $host === '127.0.0.1'
        || $host === '::1'
        || str_ends_with($host, '.test');
}

function isAllowedCorsOrigin($origin) {
    if (empty($origin) || !is_string($origin)) {
        return true;
    }

    $parts = parse_url($origin);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        return false;
    }

    $scheme = strtolower($parts['scheme']);
    $host = strtolower($parts['host']);
    $requestHost = $_SERVER['HTTP_HOST'] ?? '';

    $allowedHosts = [
        'karlgolf.app',
        'www.karlgolf.app',
        'localhost',
        '127.0.0.1',
        '::1',
    ];

    $extraOrigins = getenv('KARLGOLF_ALLOWED_ORIGINS') ?: '';
    foreach (array_filter(array_map('trim', explode(',', $extraOrigins))) as $extraOrigin) {
        $extraParts = parse_url($extraOrigin);
        if ($extraParts && !empty($extraParts['host'])) {
            $allowedHosts[] = strtolower($extraParts['host']);
        }
    }

    if (in_array($scheme, ['capacitor', 'ionic'], true) && $host === 'localhost') {
        return true;
    }

    if (!in_array($scheme, ['https', 'http'], true)) {
        return false;
    }

    if (($host === 'localhost' || $host === '127.0.0.1' || $host === '::1') && $scheme === 'http') {
        return true;
    }

    if (str_ends_with($host, '.test') && isLocalDevHost($requestHost)) {
        return in_array($scheme, ['https', 'http'], true);
    }

    if ($scheme !== 'https') {
        return false;
    }

    return in_array($host, $allowedHosts, true);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$isStateChanging = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true);
$originAllowed = isAllowedCorsOrigin($origin);

if ($origin && $originAllowed) {
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
    header("Access-Control-Max-Age: 86400");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if ($origin && !$originAllowed && ($method === 'OPTIONS' || $isStateChanging)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Origin not allowed']);
    exit;
}

// Handle preflight OPTIONS request
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
?>
