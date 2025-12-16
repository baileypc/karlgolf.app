<?php
/**
 * Karl's GIR - Rate Limiter
 * IP-based rate limiting to prevent brute force attacks
 */

require_once __DIR__ . '/data-path.php';
require_once __DIR__ . '/logger.php';

/**
 * Check if an action is rate limited
 * @param string $action Action identifier (e.g., 'login', 'register', 'password-reset')
 * @param int $maxAttempts Maximum attempts allowed
 * @param int $windowMinutes Time window in minutes
 * @return array ['allowed' => bool, 'message' => string, 'retryAfter' => int|null]
 */
function checkRateLimit($action, $maxAttempts = 5, $windowMinutes = 15) {
    $dataDir = getDataDirectory();
    if (!$dataDir) {
        // If data directory fails, allow the request (fail open)
        logError('Rate limiter: Data directory not available');
        return ['allowed' => true, 'message' => '', 'retryAfter' => null];
    }
    
    $rateLimitDir = $dataDir . '/rate-limits';
    if (!is_dir($rateLimitDir)) {
        @mkdir($rateLimitDir, 0700, true); // Secure permissions: owner read/write/execute only
    }
    
    // Get client IP
    $ip = getClientIP();
    
    $ipHash = hash('sha256', $ip . $action); // Hash IP for privacy
    $rateLimitFile = $rateLimitDir . '/' . $ipHash . '.json';
    
    // Clean up old rate limit files (older than 24 hours)
    cleanupOldRateLimits($rateLimitDir);
    
    // Load existing attempts
    $attempts = [];
    if (file_exists($rateLimitFile)) {
        $content = file_get_contents($rateLimitFile);
        $data = json_decode($content, true);
        if ($data && isset($data['attempts'])) {
            $attempts = $data['attempts'];
        }
    }
    
    // Remove attempts outside the time window
    $windowStart = time() - ($windowMinutes * 60);
    $attempts = array_filter($attempts, function($timestamp) use ($windowStart) {
        return $timestamp > $windowStart;
    });
    
    // Check if rate limit exceeded
    if (count($attempts) >= $maxAttempts) {
        $oldestAttempt = min($attempts);
        $retryAfter = ($oldestAttempt + ($windowMinutes * 60)) - time();
        
        logWarning('Rate limit exceeded', [
            'action' => $action,
            'ip' => $ip,
            'attempts' => count($attempts),
            'maxAttempts' => $maxAttempts,
            'windowMinutes' => $windowMinutes,
            'retryAfter' => $retryAfter
        ]);
        
        return [
            'allowed' => false,
            'message' => "Too many attempts. Please try again in " . ceil($retryAfter / 60) . " minutes.",
            'retryAfter' => $retryAfter
        ];
    }
    
    // Record this attempt
    $attempts[] = time();
    
    // Save updated attempts
    $data = [
        'action' => $action,
        'ip' => $ip,
        'attempts' => $attempts,
        'lastAttempt' => time()
    ];
    
    // Write file with secure permissions (0600 = owner read/write only)
    file_put_contents($rateLimitFile, json_encode($data, JSON_PRETTY_PRINT));
    @chmod($rateLimitFile, 0600); // Set secure permissions (ignore errors on Windows)
    
    return [
        'allowed' => true,
        'message' => '',
        'retryAfter' => null
    ];
}

/**
 * Get client IP address
 * @return string
 */
function getClientIP() {
    // Check for proxy headers first
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    }
    
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Clean up old rate limit files
 * @param string $rateLimitDir
 */
function cleanupOldRateLimits($rateLimitDir) {
    // Only run cleanup 10% of the time to reduce overhead
    if (rand(1, 10) !== 1) {
        return;
    }
    
    $files = glob($rateLimitDir . '/*.json');
    if (!$files) {
        return;
    }
    
    $cutoff = time() - (24 * 60 * 60); // 24 hours ago
    
    foreach ($files as $file) {
        if (filemtime($file) < $cutoff) {
            @unlink($file);
        }
    }
}

/**
 * Reset rate limit for a specific action and IP
 * Useful for testing or manual intervention
 * @param string $action
 * @param string|null $ip If null, uses current client IP
 */
function resetRateLimit($action, $ip = null) {
    $dataDir = getDataDirectory();
    if (!$dataDir) {
        return false;
    }
    
    $rateLimitDir = $dataDir . '/rate-limits';
    
    if ($ip === null) {
        $ip = getClientIP();
    }
    
    $ipHash = hash('sha256', $ip . $action);
    $rateLimitFile = $rateLimitDir . '/' . $ipHash . '.json';
    
    if (file_exists($rateLimitFile)) {
        @unlink($rateLimitFile);
        logInfo('Rate limit reset', ['action' => $action, 'ip' => $ip]);
        return true;
    }
    
    return false;
}

