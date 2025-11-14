<?php
// Karl's GIR - TEMP Reset User Data (for testing only)
require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/file-lock.php';

// Initialize session
initSession();

// Ensure user is logged in (either regular user or admin testing)
if (!isset($_SESSION['user_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated - please log in first']);
    exit;
}

$userId = $_SESSION['user_hash'];
$dataDir = __DIR__ . '/../../data/' . $userId;

try {
    // Delete user's rounds.json file
    $roundsFile = $dataDir . '/rounds.json';
    if (file_exists($roundsFile)) {
        unlink($roundsFile);
        logInfo('User data reset', ['userId' => $userId, 'file' => 'rounds.json']);
    }
    
    // Create empty rounds.json
    file_put_contents($roundsFile, json_encode([], JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'All user data has been reset'
    ]);
} catch (Exception $e) {
    logError('Failed to reset user data', ['userId' => $userId, 'error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to reset data: ' . $e->getMessage()
    ]);
}
