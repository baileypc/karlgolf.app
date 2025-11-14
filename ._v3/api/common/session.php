<?php
/**
 * Karl's GIR - Shared Session Management
 * Centralized session configuration to eliminate duplication
 */

function initSession() {
    // Configure session cookie before starting session
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_lifetime', '0');

    // Detect if we're on HTTPS
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
                (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
                (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_start();
    header('Content-Type: application/json');
}

/**
 * Check if user is logged in
 * Returns array with 'loggedIn' boolean and 'userHash' if logged in
 */
function checkAuth() {
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
        'userEmail' => $_SESSION['user_email']
    ];
}

/**
 * Require authentication - exits with error if not logged in
 */
function requireAuth() {
    $auth = checkAuth();
    if (!$auth['loggedIn']) {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
        exit;
    }
    return $auth;
}

