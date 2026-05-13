<?php
// Karl's GIR - TEMP Reset User Data (for testing only)
require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/csrf.php';

// Initialize session
initSession();

$auth = requireAuth();
requireCsrfForSessionAuth($auth);

require_once __DIR__ . '/../common/data-path.php';

$userId = $auth['userHash'];
$baseDataDir = getDataDirectory();
$dataDir = $baseDataDir . '/' . $userId;

try {
    $roundsFile = $dataDir . '/rounds.json';
    if (!writeJsonFile($roundsFile, [])) {
        throw new Exception('Failed to clear rounds file');
    }

    logInfo('User data reset', ['userId' => $userId, 'file' => 'rounds.json']);
    
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
