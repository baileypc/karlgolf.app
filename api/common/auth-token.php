<?php
/**
 * Karl's GIR - Token-Based Authentication
 * Provides stateless auth tokens for native mobile app requests.
 * File-based storage (no database) - tokens stored in user directories.
 */

require_once __DIR__ . '/data-path.php';
require_once __DIR__ . '/file-lock.php';
require_once __DIR__ . '/logger.php';

// Token expiry: 30 days
define('TOKEN_EXPIRY_DAYS', 30);

/**
 * Generate a new auth token for a user
 * @param string $userHash The user's directory hash
 * @return string The generated token
 */
function generateAuthToken(string $userHash): string {
    $dataDir = getDataDirectory();
    $userDir = $dataDir . '/' . $userHash;
    $tokensFile = $userDir . '/auth_tokens.json';
    
    // Generate a secure random token
    $token = bin2hex(random_bytes(32)); // 64 character hex string
    
    // Load existing tokens
    $tokens = readJsonFile($tokensFile, []);
    
    // Clean up expired tokens
    $now = time();
    $tokens = array_filter($tokens, function($t) use ($now) {
        return isset($t['expires']) && $t['expires'] > $now;
    });
    
    // Add new token
    $tokens[$token] = [
        'created' => $now,
        'expires' => $now + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60),
        'userHash' => $userHash
    ];
    
    // Save tokens
    if (!writeJsonFile($tokensFile, $tokens)) {
        logError('Failed to save auth token', ['userHash' => $userHash]);
        return '';
    }
    
    logInfo('Auth token generated', ['userHash' => $userHash]);
    return $token;
}

/**
 * Validate an auth token and return the user hash
 * @param string $token The token to validate
 * @return array ['valid' => bool, 'userHash' => string|null]
 */
function validateAuthToken(string $token): array {
    if (empty($token) || strlen($token) !== 64) {
        return ['valid' => false, 'userHash' => null];
    }
    
    $dataDir = getDataDirectory();
    
    // Search all user directories for this token
    // This is O(n) but acceptable for a small user base
    $userDirs = glob($dataDir . '/*', GLOB_ONLYDIR);
    
    foreach ($userDirs as $userDir) {
        $tokensFile = $userDir . '/auth_tokens.json';
        if (!file_exists($tokensFile)) continue;
        
        $tokens = readJsonFile($tokensFile, []);
        
        if (isset($tokens[$token])) {
            $tokenData = $tokens[$token];
            
            // Check expiry
            if (!isset($tokenData['expires']) || $tokenData['expires'] < time()) {
                // Token expired, remove it
                unset($tokens[$token]);
                writeJsonFile($tokensFile, $tokens);
                return ['valid' => false, 'userHash' => null];
            }
            
            // Token is valid
            $userHash = basename($userDir);
            return ['valid' => true, 'userHash' => $userHash];
        }
    }
    
    return ['valid' => false, 'userHash' => null];
}

/**
 * Invalidate (delete) an auth token
 * @param string $token The token to invalidate
 * @return bool Success
 */
function invalidateAuthToken(string $token): bool {
    if (empty($token)) return false;
    
    $dataDir = getDataDirectory();
    $userDirs = glob($dataDir . '/*', GLOB_ONLYDIR);
    
    foreach ($userDirs as $userDir) {
        $tokensFile = $userDir . '/auth_tokens.json';
        if (!file_exists($tokensFile)) continue;
        
        $tokens = readJsonFile($tokensFile, []);
        
        if (isset($tokens[$token])) {
            unset($tokens[$token]);
            writeJsonFile($tokensFile, $tokens);
            logInfo('Auth token invalidated', ['userDir' => basename($userDir)]);
            return true;
        }
    }
    
    return false;
}

/**
 * Extract Bearer token from Authorization header
 * @return string|null The token, or null if not present
 */
/**
 * Extract Bearer token from Authorization header
 * @return string|null The token, or null if not present
 */
function getBearerToken(): ?string {
    // Polyfill for getallheaders if missing (e.g. Nginx FPM)
    if (!function_exists('getallheaders')) {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        // Add Authorization header manually if not in HTTP_ prefix
        if (isset($_SERVER['PHP_AUTH_DIGEST'])) {
            $headers['Authorization'] = $_SERVER['PHP_AUTH_DIGEST'];
        } elseif (isset($_SERVER['PHP_AUTH_USER']) && isset($_SERVER['PHP_AUTH_PW'])) {
            $headers['Authorization'] = base64_encode($_SERVER['PHP_AUTH_USER'] . ':' . $_SERVER['PHP_AUTH_PW']);
        } elseif (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH'];
        } elseif (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        }
        // Typical Authorization header location in Nginx
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
        }
    } else {
        $headers = getallheaders();
    }

    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return $matches[1];
    }
    
    return null;
}
?>
