<?php
/**
 * Karl's GIR - Sync Current Unsaved Round
 * Saves/loads the current in-progress round so it syncs across devices
 * Uses shared components for session and file locking
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/cors.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/data-path.php';

// Initialize session
initSession();

// Require authentication
$auth = requireAuth();
$userHash = $auth['userHash'];
$dataDir = getDataDirectory();
$userDir = $dataDir . '/' . $userHash;
$currentRoundFile = $userDir . '/current_round.json';

// Get action from request
$action = $_GET['action'] ?? 'get';

// GET: Load current round
if ($action === 'get') {
    $data = readJsonFile($currentRoundFile, null);
    
    if ($data && is_array($data)) {
        // Always return complete state, even if some fields are missing
        echo json_encode([
            'success' => true,
            'holes' => $data['holes'] ?? [],
            'currentHole' => $data['currentHole'] ?? 1,
            'roundStarted' => $data['roundStarted'] ?? false,
            'courseName' => $data['courseName'] ?? '',
            'selectedRoundId' => $data['selectedRoundId'] ?? null,
            'lastUpdated' => $data['lastUpdated'] ?? null
        ]);
    } else {
        // No file exists or invalid data - return empty state
        echo json_encode([
            'success' => true,
            'holes' => [],
            'currentHole' => 1,
            'roundStarted' => false,
            'courseName' => '',
            'selectedRoundId' => null,
            'lastUpdated' => null
        ]);
    }
    exit;
}

// POST: Save current round
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        logWarning('Invalid sync data', ['input' => substr($json, 0, 200)]);
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        exit;
    }
    
    // Save current round data (including round state and selectedRoundId)
    $currentRoundData = [
        'holes' => $data['holes'] ?? [],
        'currentHole' => $data['currentHole'] ?? 1,
        'roundStarted' => $data['roundStarted'] ?? false,
        'courseName' => $data['courseName'] ?? '',
        'selectedRoundId' => $data['selectedRoundId'] ?? null,
        'lastUpdated' => date('Y-m-d H:i:s')
    ];
    
    if (!writeJsonFile($currentRoundFile, $currentRoundData)) {
        logError('Failed to save current round', ['file' => $currentRoundFile]);
        echo json_encode(['success' => false, 'message' => 'Failed to save current round']);
        exit;
    }
    
    logInfo('Current round synced', [
        'holes' => count($currentRoundData['holes']),
        'currentHole' => $currentRoundData['currentHole']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Current round synced',
        'holes' => count($currentRoundData['holes']),
        'currentHole' => $currentRoundData['currentHole']
    ]);
    exit;
}

// DELETE: Clear current round
if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (file_exists($currentRoundFile)) {
        if (!unlink($currentRoundFile)) {
            logError('Failed to delete current round file', ['file' => $currentRoundFile]);
            echo json_encode(['success' => false, 'message' => 'Failed to clear current round']);
            exit;
        }
    }
    logInfo('Current round cleared');
    echo json_encode(['success' => true, 'message' => 'Current round cleared']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
