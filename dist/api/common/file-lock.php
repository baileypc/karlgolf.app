<?php
/**
 * Karl's GIR - Thread-Safe File Operations
 * Prevents race conditions in concurrent file writes
 */

/**
 * Read JSON file with locking
 * @param string $filePath Path to JSON file
 * @param mixed $default Default value if file doesn't exist or is invalid
 * @return mixed Decoded JSON data or default value
 */
function getJsonBackupPath($filePath) {
    return $filePath . '.bak';
}

function decodeJsonWithBackup($content, $filePath, $default) {
    if ($content !== false && $content !== '') {
        $data = json_decode($content, true);
        if ($data !== null || json_last_error() === JSON_ERROR_NONE) {
            return $data;
        }
    }

    $backupPath = getJsonBackupPath($filePath);
    if (file_exists($backupPath)) {
        $backupContent = file_get_contents($backupPath);
        if ($backupContent !== false && $backupContent !== '') {
            $backupData = json_decode($backupContent, true);
            if ($backupData !== null || json_last_error() === JSON_ERROR_NONE) {
                error_log("Recovered JSON from backup: $filePath");
                return $backupData;
            }
        }
    }

    return $default;
}

function backupJsonFile($filePath) {
    if (!file_exists($filePath) || filesize($filePath) <= 0) {
        return;
    }

    $content = file_get_contents($filePath);
    backupJsonContent($filePath, $content);
}

function backupJsonContent($filePath, $content) {
    if ($content === false || $content === '') {
        return;
    }

    json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return;
    }

    @copy($filePath, getJsonBackupPath($filePath));
}

function readJsonFile($filePath, $default = []) {
    if (!file_exists($filePath)) {
        return $default;
    }
    
    $fp = fopen($filePath, 'r');
    if (!$fp) {
        error_log("Failed to open file for reading: $filePath");
        return $default;
    }
    
    // Acquire shared lock for reading
    if (!flock($fp, LOCK_SH)) {
        fclose($fp);
        error_log("Failed to acquire read lock: $filePath");
        return $default;
    }
    
    rewind($fp);
    clearstatcache(true, $filePath);
    $fileSize = filesize($filePath);
    $content = $fileSize > 0 ? fread($fp, $fileSize) : '';
    flock($fp, LOCK_UN);
    fclose($fp);
    
    if ($content === false) {
        return $default;
    }
    
    return decodeJsonWithBackup($content, $filePath, $default);
}

/**
 * Write JSON file with exclusive locking
 * @param string $filePath Path to JSON file
 * @param mixed $data Data to encode and write
 * @param bool $prettyPrint Whether to use JSON_PRETTY_PRINT
 * @return bool Success status
 */
function writeJsonFile($filePath, $data, $prettyPrint = true) {
    // Ensure directory exists
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            error_log("Failed to create directory: $dir");
            return false;
        }
    }
    
    $fp = fopen($filePath, 'c+'); // 'c+' mode creates file if it doesn't exist
    if (!$fp) {
        error_log("Failed to open file for writing: $filePath");
        return false;
    }
    
    // Acquire exclusive lock for writing
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        error_log("Failed to acquire write lock: $filePath");
        return false;
    }

    rewind($fp);
    clearstatcache(true, $filePath);
    $fileSize = filesize($filePath);
    $existingContent = $fileSize > 0 ? fread($fp, $fileSize) : '';
    backupJsonContent($filePath, $existingContent);
    
    // Truncate file before writing
    ftruncate($fp, 0);
    rewind($fp);
    
    $json = $prettyPrint 
        ? json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        : json_encode($data, JSON_UNESCAPED_UNICODE);
    
    $result = fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    if ($result === false) {
        error_log("Failed to write to file: $filePath");
        return false;
    }
    
    return true;
}

/**
 * Read-modify-write operation with locking
 * Ensures atomic updates to JSON files
 * @param string $filePath Path to JSON file
 * @param callable $modifyCallback Function that receives current data and returns modified data
 * @param mixed $default Default value if file doesn't exist
 * @return array ['success' => bool, 'data' => mixed]
 */
function updateJsonFile($filePath, $modifyCallback, $default = []) {
    // Ensure directory exists
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            return ['success' => false, 'data' => null, 'error' => 'Failed to create directory'];
        }
    }
    
    $fp = fopen($filePath, 'c+');
    if (!$fp) {
        return ['success' => false, 'data' => null, 'error' => 'Failed to open file'];
    }
    
    // Acquire exclusive lock
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return ['success' => false, 'data' => null, 'error' => 'Failed to acquire lock'];
    }
    
    // Read current data
    $content = '';
    $fileSize = filesize($filePath);
    if ($fileSize > 0) {
        $content = fread($fp, $fileSize);
    }
    
    $currentData = ($content && $content !== '') 
        ? json_decode($content, true) 
        : $default;
    
    if ($currentData === null && json_last_error() !== JSON_ERROR_NONE) {
        $currentData = decodeJsonWithBackup($content, $filePath, $default);
    } elseif ($currentData === null) {
        $currentData = $default;
    }
    
    // Modify data
    try {
        $modifiedData = $modifyCallback($currentData);
    } catch (Exception $e) {
        flock($fp, LOCK_UN);
        fclose($fp);
        return ['success' => false, 'data' => null, 'error' => 'Modification callback failed: ' . $e->getMessage()];
    }
    
    backupJsonContent($filePath, $content);

    // Write modified data
    ftruncate($fp, 0);
    rewind($fp);
    
    $json = json_encode($modifiedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    if ($result === false) {
        return ['success' => false, 'data' => null, 'error' => 'Failed to write file'];
    }
    
    return ['success' => true, 'data' => $modifiedData];
}

