<?php
/**
 * Karl's GIR - Shared Session Management
 * Centralized session configuration to eliminate duplication
 */

require_once __DIR__ . '/environment.php';

function initSession() {
    // Configure session cookie SameSite attribute (CSRF protection)
    // Set SameSite attribute BEFORE session_start() (PHP 7.3+)
    if (version_compare(PHP_VERSION, '7.3.0', '>=')) {
        // Use ini_set for SameSite (must be before session_start)
        ini_set('session.cookie_samesite', 'None');
        ini_set('session.cookie_secure', '1');
        
        // Also set via session_set_cookie_params with array syntax (more reliable)
        // Get defaults first
        $defaultParams = session_get_cookie_params();
        session_set_cookie_params([
            'lifetime' => $defaultParams['lifetime'],
            'path' => $defaultParams['path'] ?: '/',
            'domain' => $defaultParams['domain'] ?: '',
            'secure' => true, // Must be true for SameSite=None
            'httponly' => $defaultParams['httponly'],
            'samesite' => 'None'
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

