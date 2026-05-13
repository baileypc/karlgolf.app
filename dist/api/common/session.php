<?php
/**
 * Karl's GIR - Shared Session Management
 * Centralized session configuration to eliminate duplication
 */

require_once __DIR__ . '/environment.php';

function initSession() {
    ini_set('session.use_strict_mode', '1');

    // Detect if we're on HTTPS or local development
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
                (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    // Use localhost detection for local development
    $isLocalhost = isset($_SERVER['HTTP_HOST']) &&
                   (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
                    strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
                    strpos($_SERVER['HTTP_HOST'], '.test') !== false);

    // Configure session cookie SameSite attribute before session_start().
    if (version_compare(PHP_VERSION, '7.3.0', '>=')) {
        // Lax works for same-site app/API requests and blocks cross-site POST CSRF.
        // Native app requests use bearer tokens instead of cross-site cookies.
        $sameSite = 'Lax';
        $requireSecure = ($isLocalhost || !$isSecure) ? false : true;

        ini_set('session.cookie_samesite', $sameSite);
        ini_set('session.cookie_secure', $requireSecure ? '1' : '0');
        ini_set('session.cookie_httponly', '1');

        $defaultParams = session_get_cookie_params();
        session_set_cookie_params([
            'lifetime' => $defaultParams['lifetime'],
            'path' => $defaultParams['path'] ?: '/',
            'domain' => $defaultParams['domain'] ?: '',
            'secure' => $requireSecure,
            'httponly' => true,
            'samesite' => $sameSite
        ]);
    }

    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    // Set headers to prevent caching and ensure JSON response
    header('Content-Type: application/json');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
}

/**
 * Check if user is logged in.
 * Supports both session cookies (PWA) and Bearer tokens (native app).
 * Returns array with 'loggedIn' boolean and 'userHash' if logged in.
 */
function checkAuth() {
    // First, check for Bearer token (native app)
    require_once __DIR__ . '/auth-token.php';
    $token = getBearerToken();

    if ($token) {
        $tokenAuth = validateAuthToken($token);
        if ($tokenAuth['valid']) {
            return [
                'loggedIn' => true,
                'userHash' => $tokenAuth['userHash'],
                'userEmail' => null,
                'authMethod' => 'token'
            ];
        }
    }

    // Fall back to session cookies (PWA)
    if (!isset($_SESSION['user_email']) || !isset($_SESSION['user_hash'])) {
        return [
            'loggedIn' => false,
            'userHash' => null,
            'userEmail' => null
        ];
    }

    return [
        'loggedIn' => true,
        'userHash' => $_SESSION['user_hash'],
        'userEmail' => $_SESSION['user_email'],
        'authMethod' => 'session'
    ];
}

/**
 * Require authentication - exits with error if not logged in.
 */
function requireAuth() {
    try {
        $auth = checkAuth();
        if (!$auth['loggedIn']) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Not logged in'
            ]);
            exit;
        }
        return $auth;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Authentication failed'
        ]);
        exit;
    }
}
?>
