<?php
/**
 * Karl's GIR - Delete Single Round
 * Deletes a specific round by stable roundId or legacy roundNumber.
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/cors.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/data-path.php';
require_once __DIR__ . '/../common/csrf.php';

initSession();

$auth = requireAuth();
requireCsrfForSessionAuth($auth);
$userHash = $auth['userHash'];
$dataDir = getDataDirectory();
$userDir = $dataDir . '/' . $userHash;
$roundsFile = $userDir . '/rounds.json';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || (!isset($data['roundNumber']) && empty($data['roundId']))) {
    logWarning('Invalid delete request', ['input' => substr($json, 0, 200)]);
    echo json_encode(['success' => false, 'message' => 'Round identifier required']);
    exit;
}

$roundNumber = isset($data['roundNumber']) ? (int)$data['roundNumber'] : null;
$roundId = isset($data['roundId']) && is_string($data['roundId']) ? trim($data['roundId']) : null;
$deletedRound = null;

$result = updateJsonFile($roundsFile, function($rounds) use ($roundNumber, $roundId, &$deletedRound) {
    if (empty($rounds) || !is_array($rounds)) {
        return [];
    }

    $roundIndex = null;
    foreach ($rounds as $index => $round) {
        $storedRoundId = $round['roundId'] ?? null;
        $storedRoundNumber = isset($round['roundNumber']) ? (int)$round['roundNumber'] : ($index + 1);

        if (($roundId && $storedRoundId === $roundId) || (!$roundId && $roundNumber !== null && $storedRoundNumber === $roundNumber)) {
            $roundIndex = $index;
            $deletedRound = $round;
            break;
        }
    }

    if ($roundIndex === null) {
        return $rounds;
    }

    unset($rounds[$roundIndex]);
    $rounds = array_values($rounds);

    // Keep legacy display numbers contiguous, but roundId remains the stable identity.
    foreach ($rounds as $index => &$round) {
        $round['roundNumber'] = $index + 1;
    }
    unset($round);

    return $rounds;
}, []);

if (!$result['success']) {
    logError('Failed to delete round transaction', ['roundNumber' => $roundNumber, 'roundId' => $roundId]);
    echo json_encode(['success' => false, 'message' => 'Failed to delete round']);
    exit;
}

if (!$deletedRound) {
    logWarning('Round not found', ['roundNumber' => $roundNumber, 'roundId' => $roundId]);
    echo json_encode(['success' => false, 'message' => 'Round not found']);
    exit;
}

logInfo('Round deleted', [
    'roundNumber' => $roundNumber,
    'roundId' => $roundId,
    'courseName' => $deletedRound['courseName'] ?? 'Unknown',
    'totalRounds' => count($result['data'] ?? [])
]);

echo json_encode([
    'success' => true,
    'message' => 'Round deleted successfully',
    'totalRounds' => count($result['data'] ?? [])
]);
?>
