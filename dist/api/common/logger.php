<?php
/**
 * Karl's GIR - Structured Error Logging
 * Centralized logging system for better debugging and monitoring
 */

/**
 * Log levels
 */
define('LOG_LEVEL_DEBUG', 0);
define('LOG_LEVEL_INFO', 1);
define('LOG_LEVEL_WARNING', 2);
define('LOG_LEVEL_ERROR', 3);

/**
 * Log a message with context
 * @param string $message Log message
 * @param int $level Log level (LOG_LEVEL_*)
 * @param array $context Additional context data
 */
function logMessage($message, $level = LOG_LEVEL_INFO, $context = []) {
    $levelNames = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
    $levelName = $levelNames[$level] ?? 'INFO';
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = [
        'timestamp' => $timestamp,
        'level' => $levelName,
        'message' => $message,
        'context' => $context
    ];
    
    // Include user info if available
    if (isset($_SESSION['user_email'])) {
        $logEntry['user'] = $_SESSION['user_email'];
    }
    
    // Include request info
    $logEntry['request'] = [
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
        'uri' => $_SERVER['REQUEST_URI'] ?? 'UNKNOWN',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN'
    ];
    
    $logLine = json_encode($logEntry) . PHP_EOL;
    error_log($logLine);
}

/**
 * Log debug message
 */
function logDebug($message, $context = []) {
    logMessage($message, LOG_LEVEL_DEBUG, $context);
}

/**
 * Log info message
 */
function logInfo($message, $context = []) {
    logMessage($message, LOG_LEVEL_INFO, $context);
}

/**
 * Log warning message
 */
function logWarning($message, $context = []) {
    logMessage($message, LOG_LEVEL_WARNING, $context);
}

/**
 * Log error message
 */
function logError($message, $context = []) {
    logMessage($message, LOG_LEVEL_ERROR, $context);
}

