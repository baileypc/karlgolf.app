<?php
/**
 * Karl's GIR - Save Round to User Account
 * Saves round data to user's rounds.json file with stable round IDs.
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/cors.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/stats-calculator.php';
require_once __DIR__ . '/../common/round-merger.php';
require_once __DIR__ . '/../common/validation.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/analytics-tracker.php';
require_once __DIR__ . '/../common/data-path.php';
require_once __DIR__ . '/../common/csrf.php';

initSession();

$auth = requireAuth();
requireCsrfForSessionAuth($auth);
$userHash = $auth['userHash'];
$userEmail = $auth['userEmail'] ?? '';
$dataDir = getDataDirectory();
$userDir = $dataDir . '/' . $userHash;
$roundsFile = $userDir . '/rounds.json';
$passwordFile = $userDir . '/password.txt';

if (!is_dir($userDir)) {
    logError('User account not found - directory missing', [
        'userHash' => $userHash,
        'userEmail' => $userEmail ?? 'unknown'
    ]);
    echo json_encode([
        'success' => false,
        'message' => 'User account not found. Please log out and log back in.',
        'errorCode' => 'ACCOUNT_NOT_FOUND'
    ]);
    exit;
}

if (!file_exists($passwordFile)) {
    logError('User account invalid - password file missing', [
        'userHash' => $userHash,
        'userEmail' => $userEmail ?? 'unknown'
    ]);
    echo json_encode([
        'success' => false,
        'message' => 'Account data is invalid. Please log out and log back in.',
        'errorCode' => 'ACCOUNT_INVALID'
    ]);
    exit;
}

$json = file_get_contents('php://input');
$roundData = json_decode($json, true);

if (!$roundData) {
    logWarning('Invalid round data JSON', ['input' => substr($json, 0, 200)]);
    echo json_encode(['success' => false, 'message' => 'Invalid round data']);
    exit;
}

$validation = validateRoundData($roundData);
if (!$validation['valid']) {
    logWarning('Round data validation failed', ['errors' => $validation['errors']]);
    echo json_encode([
        'success' => false,
        'message' => 'Validation failed: ' . implode(', ', $validation['errors'])
    ]);
    exit;
}

$roundData = $validation['sanitized'];
$courseName = $roundData['courseName'];
$mergeIntoRoundId = $roundData['mergeIntoRoundId'] ?? null;
$replaceRoundNumber = $roundData['replaceRoundNumber'] ?? null;
$completed = $roundData['completed'] ?? false;
$roundId = $roundData['roundId'] ?? ('round_' . bin2hex(random_bytes(16)));
$roundData['roundId'] = $roundId;

function findRoundIndexByRoundId($rounds, $roundId) {
    foreach ($rounds as $idx => $round) {
        if (($round['roundId'] ?? null) === $roundId) {
            return $idx;
        }
    }
    return null;
}

function findRoundIndexByRoundNumber($rounds, $roundNumber) {
    foreach ($rounds as $idx => $round) {
        if (($round['roundNumber'] ?? ($idx + 1)) == $roundNumber) {
            return $idx;
        }
    }
    return null;
}

function applyRoundDataToExisting($existingRound, $roundData, $courseName, $completed, $roundId) {
    $existingHoles = $existingRound['holes'] ?? [];
    $newHoles = $roundData['holes'] ?? [];
    $replaceMode = $completed || count($newHoles) <= count($existingHoles) || count($existingHoles) >= 18;

    if ($replaceMode) {
        $stats = calculateStats($newHoles);
        if (!$stats) {
            return ['success' => false, 'message' => 'No valid holes found'];
        }

        $existingRound['holes'] = $newHoles;
        $existingRound['stats'] = $stats;
        $existingRound['courseName'] = $courseName;
        $existingRound['roundId'] = $existingRound['roundId'] ?? $roundId;
        $existingRound['lastUpdated'] = date('Y-m-d H:i:s');
        $existingRound['lastEdited'] = date('c');

        if (array_key_exists('courseMetadata', $roundData)) {
            $existingRound['courseMetadata'] = $roundData['courseMetadata'];
        }
        if ($completed) {
            $existingRound['completed'] = true;
        }

        return [
            'success' => true,
            'round' => $existingRound,
            'merged' => false,
            'replaced' => true,
            'holesAdded' => 0,
            'holesUpdated' => count($newHoles),
            'totalHoles' => count($newHoles)
        ];
    }

    $mergeResult = mergeRound($existingRound, $roundData);
    if (!$mergeResult['success']) {
        return ['success' => false, 'message' => $mergeResult['error']];
    }

    $mergedRound = $mergeResult['round'];
    $mergedRound['roundId'] = $mergedRound['roundId'] ?? $roundId;
    $mergedRound['courseName'] = $courseName;
    if (array_key_exists('courseMetadata', $roundData)) {
        $mergedRound['courseMetadata'] = $roundData['courseMetadata'];
    }
    if ($completed) {
        $mergedRound['completed'] = true;
    }

    return [
        'success' => true,
        'round' => $mergedRound,
        'merged' => true,
        'replaced' => false,
        'holesAdded' => $mergeResult['added'],
        'holesUpdated' => $mergeResult['updated'],
        'totalHoles' => count($mergedRound['holes'] ?? []),
        'maxHoleNumber' => $mergeResult['maxHoleNumber']
    ];
}

$response = null;
$analyticsHoles = 0;
$analyticsCompleted = false;

$result = updateJsonFile($roundsFile, function($rounds) use (
    &$response,
    &$analyticsHoles,
    &$analyticsCompleted,
    $roundData,
    $courseName,
    $completed,
    $roundId,
    $mergeIntoRoundId,
    $replaceRoundNumber
) {
    if (!is_array($rounds)) {
        $rounds = [];
    }

    // Prefer stable identity when present. This makes retries idempotent.
    $targetIndex = findRoundIndexByRoundId($rounds, $roundId);

    if ($targetIndex === null && $replaceRoundNumber !== null) {
        $targetIndex = findRoundIndexByRoundNumber($rounds, $replaceRoundNumber);
        if ($targetIndex === null) {
            $response = ['success' => false, 'message' => 'Round not found'];
            return $rounds;
        }
    }

    if ($targetIndex === null && $mergeIntoRoundId !== null && $mergeIntoRoundId !== '' && $mergeIntoRoundId >= 0 && $mergeIntoRoundId < count($rounds)) {
        $existingCourseName = trim($rounds[$mergeIntoRoundId]['courseName'] ?? '');
        if (strtolower(trim($courseName)) !== strtolower($existingCourseName)) {
            $response = ['success' => false, 'message' => 'Cannot merge into this round'];
            return $rounds;
        }
        $targetIndex = (int)$mergeIntoRoundId;
    }

    if ($targetIndex === null) {
        $targetIndex = findIncompleteRoundByCourse($rounds, $courseName);
    }

    if ($targetIndex !== null) {
        $update = applyRoundDataToExisting($rounds[$targetIndex], $roundData, $courseName, $completed, $roundId);
        if (!$update['success']) {
            $response = ['success' => false, 'message' => $update['message']];
            return $rounds;
        }

        $rounds[$targetIndex] = $update['round'];
        $analyticsHoles = $update['totalHoles'];
        $analyticsCompleted = $completed || $analyticsHoles >= 9;
        $response = [
            'success' => true,
            'message' => 'Round updated successfully',
            'roundId' => $rounds[$targetIndex]['roundId'],
            'roundNumber' => $rounds[$targetIndex]['roundNumber'] ?? ($targetIndex + 1),
            'totalRounds' => count($rounds),
            'merged' => $update['merged'],
            'replaced' => $update['replaced'],
            'totalHoles' => $analyticsHoles,
            'holesAdded' => $update['holesAdded'],
            'holesUpdated' => $update['holesUpdated']
        ];
        if (isset($update['maxHoleNumber'])) {
            $response['maxHoleNumber'] = $update['maxHoleNumber'];
        }

        return $rounds;
    }

    $stats = calculateStats($roundData['holes']);
    if (!$stats) {
        $response = ['success' => false, 'message' => 'No valid holes found'];
        return $rounds;
    }

    $holeCount = count($roundData['holes'] ?? []);
    $newRound = [
        'roundId' => $roundId,
        'timestamp' => date('Y-m-d H:i:s'),
        'date' => date('Y-m-d'),
        'courseName' => $courseName,
        'roundNumber' => count($rounds) + 1,
        'holes' => $roundData['holes'],
        'stats' => $stats,
        'completed' => (bool)$completed
    ];

    if (array_key_exists('courseMetadata', $roundData)) {
        $newRound['courseMetadata'] = $roundData['courseMetadata'];
    }

    $rounds[] = $newRound;
    $analyticsHoles = $holeCount;
    $analyticsCompleted = $completed || $holeCount >= 9;
    $response = [
        'success' => true,
        'message' => 'Round saved successfully',
        'roundId' => $roundId,
        'roundNumber' => $newRound['roundNumber'],
        'totalRounds' => count($rounds),
        'totalHoles' => $holeCount
    ];

    return $rounds;
}, []);

if (!$result['success']) {
    logError('Failed to save round transaction', ['error' => $result['error'] ?? 'unknown']);
    echo json_encode(['success' => false, 'message' => 'Failed to save round']);
    exit;
}

if (!$response) {
    echo json_encode(['success' => false, 'message' => 'Failed to save round']);
    exit;
}

if (!empty($response['success'])) {
    trackRoundEvent('save', 'registered', $userHash, $analyticsHoles, $analyticsCompleted);
}

echo json_encode($response);
?>
