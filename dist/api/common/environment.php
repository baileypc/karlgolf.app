<?php
/**
 * Karl's GIR - Environment Detection
 * Auto-detects development vs production environment
 */

/**
 * Check if running on localhost/development
 * @return bool
 */
function isLocalhost() {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    
    // Check for localhost, .test domains, or local IP addresses
    return strpos($host, 'localhost') !== false || 
           strpos($host, '.test') !== false ||
           strpos($host, '127.0.0.1') !== false ||
           strpos($host, '::1') !== false;
}

/**
 * Check if running in development environment
 * @return bool
 */
function isDevelopment() {
    return isLocalhost();
}

/**
 * Check if running in production environment
 * @return bool
 */
function isProduction() {
    return !isLocalhost();
}

/**
 * Check if debug mode is enabled
 * Debug mode is enabled in development, disabled in production
 * @return bool
 */
function isDebugMode() {
    return isDevelopment();
}

/**
 * Get current environment name
 * @return string 'development' or 'production'
 */
function getEnvironment() {
    return isProduction() ? 'production' : 'development';
}

/**
 * Get the appropriate domain for the current environment
 * @return string
 */
function getDomain() {
    if (isProduction()) {
        return 'karlgolf.app';
    }
    
    // Development: use actual host or fallback to localhost
    return $_SERVER['HTTP_HOST'] ?? 'localhost';
}

/**
 * Get the base URL for the current environment
 * @return string
 */
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = getDomain();
    return $protocol . '://' . $host;
}

