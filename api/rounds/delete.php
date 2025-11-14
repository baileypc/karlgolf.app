<?php
/**
 * Karl's GIR - Delete Single Round
 * Deletes a specific round by roundNumber from user's rounds.json
 * Uses shared components for session and file locking
 */

require_once __DIR__ . '/../common/session.php';
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
$roundsFile = $userDir . '/rounds.json';

// Get roundNumber from request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['roundNumber'])) {
    logWarning('Invalid delete request', ['input' => substr($json, 0, 200)]);
    echo json_encode(['success' => false, 'message' => 'Round number required']);
    exit;
}

$roundNumber = (int)$data['roundNumber'];

// Load rounds with file locking
$rounds = readJsonFile($roundsFile, []);

if (empty($rounds) || !is_array($rounds)) {
    echo json_encode(['success' => false, 'message' => 'No rounds found']);
    exit;
}

// Find the round by matching roundNumber (not by index, since rounds may have been renumbered)
$roundIndex = null;
$deletedRound = null;
foreach ($rounds as $index => $round) {
    $roundNum = isset($round['roundNumber']) ? (int)$round['roundNumber'] : ($index + 1);
    if ($roundNum === $roundNumber) {
        $roundIndex = $index;
        $deletedRound = $round;
        break;
    }
}

if ($roundIndex === null || !$deletedRound) {
    logWarning('Round not found', ['roundNumber' => $roundNumber, 'totalRounds' => count($rounds)]);
    echo json_encode(['success' => false, 'message' => 'Round not found']);
    exit;
}

// Remove the round
unset($rounds[$roundIndex]);

// Re-index array and update roundNumbers
$rounds = array_values($rounds);
foreach ($rounds as $index => &$round) {
    $round['roundNumber'] = $index + 1;
}
unset($round);

// Save with file locking
if (!writeJsonFile($roundsFile, $rounds)) {
    logError('Failed to delete round', ['roundNumber' => $roundNumber]);
    echo json_encode(['success' => false, 'message' => 'Failed to delete round']);
    exit;
}

logInfo('Round deleted', [
    'roundNumber' => $roundNumber,
    'courseName' => $deletedRound['courseName'] ?? 'Unknown',
    'totalRounds' => count($rounds)
]);

echo json_encode([
    'success' => true,
    'message' => 'Round deleted successfully',
    'totalRounds' => count($rounds)
]);
?>

