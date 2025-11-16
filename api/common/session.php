<?php
/**
 * Karl's GIR - Shared Session Management
 * Centralized session configuration to eliminate duplication
 */

require_once __DIR__ . '/environment.php';

function initSession() {
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

