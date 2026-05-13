<?php
/**
 * Karl's GIR - CSRF Protection
 * Protects cookie-authenticated state-changing requests.
 *
 * Bearer-token native requests are exempt because they do not rely on browser
 * cookies and are not vulnerable to browser-driven CSRF in the same way.
 */

function getCsrfToken() {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function rotateCsrfToken() {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf_token'];
}

function getRequestCsrfToken() {
    $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (is_string($headerToken) && $headerToken !== '') {
        return $headerToken;
    }

    $bodyToken = $_POST['_csrf'] ?? '';
    return is_string($bodyToken) ? $bodyToken : '';
}

function isStateChangingRequest() {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    return in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true);
}

function requireCsrfForSessionAuth($auth = null) {
    if (!isStateChangingRequest()) {
        return;
    }

    $authMethod = is_array($auth) ? ($auth['authMethod'] ?? null) : null;
    if ($authMethod !== 'session') {
        return;
    }

    $expected = getCsrfToken();
    $provided = getRequestCsrfToken();

    if (!$provided || !hash_equals($expected, $provided)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Security token expired. Please refresh and try again.',
            'errorCode' => 'CSRF_TOKEN_INVALID'
        ]);
        exit;
    }
}
?>
