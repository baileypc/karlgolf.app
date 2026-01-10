<?php
/**
 * Karl's GIR - Save Round to User Account
 * Saves completed round data to user's rounds.json file
 * Uses shared components for session, file locking, stats, and validation
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/stats-calculator.php';
require_once __DIR__ . '/../common/round-merger.php';
require_once __DIR__ . '/../common/validation.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/analytics-tracker.php';

// Initialize session
initSession();

// Require authentication
$auth = requireAuth();
$userHash = $auth['userHash'];
$userDir = __DIR__ . '/../../data/' . $userHash;
$roundsFile = $userDir . '/rounds.json';

// Check if user directory exists
if (!is_dir($userDir)) {
    logError('User account not found', ['userHash' => $userHash]);
    echo json_encode(['success' => false, 'message' => 'User account not found']);
    exit;
}

// Get and validate JSON input
$json = file_get_contents('php://input');
$roundData = json_decode($json, true);

if (!$roundData) {
    logWarning('Invalid round data JSON', ['input' => substr($json, 0, 200)]);
    echo json_encode(['success' => false, 'message' => 'Invalid round data']);
    exit;
}

// Validate round data
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
$isMerging = $mergeIntoRoundId !== null && $mergeIntoRoundId !== '';

logInfo('Save round request', [
    'mergeIntoRoundId' => $mergeIntoRoundId,
    'isMerging' => $isMerging,
    'holesCount' => count($roundData['holes'] ?? []),
    'holes' => array_map(function($h) { 
        return ['holeNumber' => $h['holeNumber'] ?? 'N/A', 'score' => $h['score'] ?? 'N/A']; 
    }, $roundData['holes'] ?? []),
    'courseName' => $courseName
]);

// Load existing rounds with file locking
$rounds = readJsonFile($roundsFile, []);

// Handle explicit merge request
if ($isMerging && $mergeIntoRoundId >= 0 && $mergeIntoRoundId < count($rounds)) {
    $existingRound = $rounds[$mergeIntoRoundId];
    $existingCourseName = trim($existingRound['courseName'] ?? '');
    
    // Verify course name matches (case-insensitive)
    if (strtolower(trim($courseName)) !== strtolower($existingCourseName)) {
        logWarning('Course name mismatch for merge', [
            'existing' => $existingCourseName,
            'new' => $courseName
        ]);
        echo json_encode(['success' => false, 'message' => 'Cannot merge into this round']);
        exit;
    }
    
    // Perform merge
    $mergeResult = mergeRound($existingRound, $roundData);
    
    if (!$mergeResult['success']) {
        logWarning('Merge failed', ['error' => $mergeResult['error']]);
        echo json_encode([
            'success' => false,
            'message' => $mergeResult['error'],
            'totalHoles' => count($existingRound['holes'] ?? [])
        ]);
        exit;
    }
    
    // Update rounds array with merged round
    $rounds[$mergeIntoRoundId] = $mergeResult['round'];
    
    // Save with file locking
    if (!writeJsonFile($roundsFile, $rounds)) {
        logError('Failed to save merged round', ['roundIndex' => $mergeIntoRoundId]);
        echo json_encode(['success' => false, 'message' => 'Failed to merge round']);
        exit;
    }
    
        logInfo('Round merged successfully', [
            'roundNumber' => $mergeIntoRoundId + 1,
            'holesAdded' => $mergeResult['added'],
            'holesUpdated' => $mergeResult['updated'],
            'totalHoles' => count($mergeResult['round']['holes']),
            'holeNumbers' => array_map(function($h) { 
                return $h['holeNumber'] ?? 'N/A'; 
            }, $mergeResult['round']['holes'])
        ]);
        
        // Track round completion for analytics
        $totalHoles = count($mergeResult['round']['holes']);
        $completed = $totalHoles >= 9;
        trackRoundEvent('save', 'registered', $userHash, $totalHoles, $completed);
        
        echo json_encode([
            'success' => true,
            'message' => 'Round updated successfully',
            'roundNumber' => $mergeIntoRoundId + 1,
            'totalRounds' => count($rounds),
            'merged' => true,
            'totalHoles' => $totalHoles,
            'holesAdded' => $mergeResult['added'],
            'holesUpdated' => $mergeResult['updated'],
            'maxHoleNumber' => $mergeResult['maxHoleNumber']
        ]);
        exit;
}

// Check for auto-merge (incomplete round with same course name)
if (!$isMerging) {
    $incompleteRoundIdx = findIncompleteRoundByCourse($rounds, $courseName);
    
    if ($incompleteRoundIdx !== null) {
        logInfo('Auto-merging into existing incomplete round', [
            'roundIndex' => $incompleteRoundIdx,
            'courseName' => $courseName
        ]);
        
        $existingRound = $rounds[$incompleteRoundIdx];
        $mergeResult = mergeRound($existingRound, $roundData);
        
        if (!$mergeResult['success']) {
            logWarning('Auto-merge failed', ['error' => $mergeResult['error']]);
            echo json_encode([
                'success' => false,
                'message' => $mergeResult['error'],
                'totalHoles' => count($existingRound['holes'] ?? [])
            ]);
            exit;
        }
        
        // Update rounds array
        $rounds[$incompleteRoundIdx] = $mergeResult['round'];
        
        // Save with file locking
        if (!writeJsonFile($roundsFile, $rounds)) {
            logError('Failed to save auto-merged round', ['roundIndex' => $incompleteRoundIdx]);
            echo json_encode(['success' => false, 'message' => 'Failed to auto-merge round']);
            exit;
        }
        
        logInfo('Round auto-merged successfully', [
            'roundNumber' => $incompleteRoundIdx + 1,
            'holesAdded' => $mergeResult['added'],
            'holesUpdated' => $mergeResult['updated']
        ]);
        
        // Track round completion for analytics
        $totalHoles = count($mergeResult['round']['holes']);
        $completed = $totalHoles >= 9;
        trackRoundEvent('save', 'registered', $userHash, $totalHoles, $completed);
        
        echo json_encode([
            'success' => true,
            'message' => 'Round auto-merged successfully',
            'roundNumber' => $incompleteRoundIdx + 1,
            'totalRounds' => count($rounds),
            'merged' => true,
            'autoMerged' => true,
            'totalHoles' => $totalHoles,
            'holesAdded' => $mergeResult['added'],
            'holesUpdated' => $mergeResult['updated'],
            'maxHoleNumber' => $mergeResult['maxHoleNumber']
        ]);
        exit;
    }
}

// Create new round
$today = date('Y-m-d');
$holeCount = count($roundData['holes'] ?? []);

// Calculate stats for new round
$stats = calculateStats($roundData['holes']);
if (!$stats) {
    logWarning('No valid holes in round data');
    echo json_encode(['success' => false, 'message' => 'No valid holes found']);
    exit;
}

$newRound = [
    'timestamp' => date('Y-m-d H:i:s'),
    'date' => $today,
    'courseName' => $courseName,
    'roundNumber' => count($rounds) + 1,
    'holes' => $roundData['holes'],
    'stats' => $stats
];

// Add round to array
$rounds[] = $newRound;

// Save with file locking
if (!writeJsonFile($roundsFile, $rounds)) {
    logError('Failed to save new round');
    echo json_encode(['success' => false, 'message' => 'Failed to save round']);
    exit;
}

logInfo('New round saved successfully', [
    'roundNumber' => $newRound['roundNumber'],
    'totalRounds' => count($rounds),
    'holesCount' => $holeCount,
    'holeNumbers' => array_map(function($h) { 
        return $h['holeNumber'] ?? 'N/A'; 
    }, $newRound['holes'])
]);

// Track round completion for analytics
$completed = $holeCount >= 9; // Consider 9+ holes as completed
trackRoundEvent('save', 'registered', $userHash, $holeCount, $completed);

echo json_encode([
    'success' => true,
    'message' => 'Round saved successfully',
    'roundNumber' => $newRound['roundNumber'],
    'totalRounds' => count($rounds)
]);
?>
