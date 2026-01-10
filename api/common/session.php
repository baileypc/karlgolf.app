<?php
/**
 * Karl's GIR - Shared Session Management
 * Centralized session configuration to eliminate duplication
 */

require_once __DIR__ . '/environment.php';

function initSession() {
    // Detect if we're on HTTPS or local development
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
                (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    // Use localhost detection for local development
    $isLocalhost = isset($_SERVER['HTTP_HOST']) &&
                   (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
                    strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
                    strpos($_SERVER['HTTP_HOST'], '.test') !== false);

    // Configure session cookie SameSite attribute (CSRF protection)
    // Set SameSite attribute BEFORE session_start() (PHP 7.3+)
    if (version_compare(PHP_VERSION, '7.3.0', '>=')) {
        // For local development, use Lax and don't require secure
        // For production (HTTPS), use None and require secure
        $sameSite = ($isLocalhost || !$isSecure) ? 'Lax' : 'None';
        $requireSecure = ($isLocalhost || !$isSecure) ? false : true;

        // Use ini_set for SameSite (must be before session_start)
        ini_set('session.cookie_samesite', $sameSite);
        ini_set('session.cookie_secure', $requireSecure ? '1' : '0');

        // Also set via session_set_cookie_params with array syntax (more reliable)
        // Get defaults first
        $defaultParams = session_get_cookie_params();
        session_set_cookie_params([
            'lifetime' => $defaultParams['lifetime'],
            'path' => $defaultParams['path'] ?: '/',
            'domain' => $defaultParams['domain'] ?: '',
            'secure' => $requireSecure,
            'httponly' => $defaultParams['httponly'],
            'samesite' => $sameSite
        ]);
    }
    
    // Use plain session_start() - SiteGround doesn't accept options array
    session_start();

    // Debug session after starting
    error_log('🔍 Session Started - ID: ' . session_id());
    error_log('🔍 Session Started - status: ' . session_status());
    error_log('🔍 Session Started - cookie_params: ' . json_encode(session_get_cookie_params()));

    // Set headers to prevent caching and ensure JSON response
    header('Content-Type: application/json');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
}

/**
 * Check if user is logged in
 * Supports both session cookies (PWA) and Bearer tokens (native app)
 * Returns array with 'loggedIn' boolean and 'userHash' if logged in
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
                'userEmail' => null, // Email not stored in token, but userHash is sufficient
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
 * Require authentication - exits with error if not logged in
 */
function requireAuth() {
    try {
        $auth = checkAuth();
        if (!$auth['loggedIn']) {
            // Debug failure reason
            $debug = [
                'session_id' => session_id(),
                'has_token' => (bool)getBearerToken(),
                'token_val' => substr(getBearerToken() ?? '', 0, 5) . '...',
                'session_email' => $_SESSION['user_email'] ?? 'unset',
            ];
            
            http_response_code(401); // Unauthorized
            echo json_encode([
                'success' => false, 
                'message' => 'Not logged in',
                'debug' => $debug
            ]);
            exit;
        }
        return $auth;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Auth Error: ' . $e->getMessage()
        ]);
        exit;
    }
}

