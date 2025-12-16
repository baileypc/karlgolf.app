<?php
/**
 * Karl's GIR - Data Directory Path Resolver
 * Auto-detects environment and returns the correct data directory path
 *
 * Production: /api/rounds/save.php -> /data/
 * Local: /public/api/rounds/save.php -> /data/ (root, not /public/data/)
 *
 * CRITICAL: Data is ALWAYS stored in root /data/, never in /public/data/
 * This prevents Vite from deleting user accounts during builds
 */

require_once __DIR__ . '/environment.php';
require_once __DIR__ . '/logger.php';

/**
 * Get the data directory path
 * Automatically detects if running from /public/api (local) or /api (production)
 * Always returns the root /data/ directory
 */
function getDataDirectory() {
    // This file is at: api/common/data-path.php
    $commonDir = __DIR__; // Full path to api/common/
    $apiDir = dirname($commonDir); // Full path to api/
    $parentDir = dirname($apiDir); // Parent of api/ (could be /public/ or root /)

    // Auto-detect: If parent is "dist", "public", or "public_html", we need to go up one more level
    // to reach the true project root (outside the web-accessible directory)
    $parentBasename = basename($parentDir);
    if ($parentBasename === 'dist' || $parentBasename === 'public' || $parentBasename === 'public_html') {
        // Local: /dist/api/ or /public/api/ -> go up to root -> /data/
        // Production: /public_html/api/ -> go up to root -> /data/
        $projectRoot = dirname($parentDir);
    } else {
        // Fallback: /api/ -> parent is root -> /data/
        $projectRoot = $parentDir;
    }

    $dataDir = $projectRoot . '/data';

    // Ensure directory exists and is writable
    if (!is_dir($dataDir)) {
        $created = @mkdir($dataDir, 0755, true);
        if (!$created) {
            logError('Failed to create data directory', [
                'dataDir' => $dataDir,
                'error' => error_get_last()
            ]);
            return false;
        }
    }

    // Verify directory is writable (skip on Windows as is_writable() is unreliable)
    if (DIRECTORY_SEPARATOR !== '\\' && !is_writable($dataDir)) {
        logError('Data directory is not writable', [
            'dataDir' => $dataDir,
            'permissions' => substr(sprintf('%o', fileperms($dataDir)), -4)
        ]);
        return false;
    }

    // Debug logging (only in development)
    if (isDebugMode()) {
        logDebug('Data directory resolved', [
            'dataDir' => $dataDir,
            'apiDir' => $apiDir,
            'parentDir' => $parentDir,
            'environment' => getEnvironment()
        ]);
    }

    return $dataDir;
}

