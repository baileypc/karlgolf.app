<?php
// Karl's GIR - Save Round to User Account
// Saves completed round data to user's rounds.json file

// Configure session cookie before starting session (same as auth.php)
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_lifetime', '0');

// Detect if we're on HTTPS
$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
            (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $isSecure,
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_email']) || !isset($_SESSION['user_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

// Get JSON input
$json = file_get_contents('php://input');
$roundData = json_decode($json, true);

if (!$roundData) {
    echo json_encode(['success' => false, 'message' => 'Invalid round data']);
    exit;
}

// Validate required fields
$requiredFields = ['holes', 'stats'];
if (!isset($roundData['holes']) || !isset($roundData['stats'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$userHash = $_SESSION['user_hash'];
$userDir = __DIR__ . '/data/' . $userHash;

// Check if user directory exists
if (!is_dir($userDir)) {
    echo json_encode(['success' => false, 'message' => 'User account not found']);
    exit;
}

// Load existing rounds
$roundsFile = $userDir . '/rounds.json';
$rounds = [];

if (file_exists($roundsFile)) {
    $existingData = file_get_contents($roundsFile);
    $rounds = json_decode($existingData, true) ?: [];
}

// Sanitize course name to prevent XSS
$courseName = trim($roundData['courseName'] ?? '');
if (empty($courseName)) {
    echo json_encode(['success' => false, 'message' => 'Course name is required']);
    exit;
}
$courseName = htmlspecialchars($courseName, ENT_QUOTES, 'UTF-8');
$courseName = substr($courseName, 0, 100); // Limit length to 100 characters

$today = date('Y-m-d');
$holeCount = count($roundData['holes'] ?? []);
$isCompleteRound = ($holeCount === 9 || $holeCount === 18);

// Check if merging into existing incomplete round
$mergeIntoRoundId = $roundData['mergeIntoRoundId'] ?? null;
$isMerging = $mergeIntoRoundId !== null && $mergeIntoRoundId !== '';

if ($isMerging && $mergeIntoRoundId >= 0 && $mergeIntoRoundId < count($rounds)) {
    // Merge into existing round
    $existingRound = &$rounds[$mergeIntoRoundId];
    
    // Check if this is a valid incomplete round to merge into
    // Must be: incomplete (< 18 holes), same course name, and same date
    $existingHoleCount = count($existingRound['holes'] ?? []);
    $existingCourseName = trim($existingRound['courseName'] ?? '');
    $existingDate = $existingRound['date'] ?? '';
    
    // Can only merge if round has less than 18 holes
    if ($existingHoleCount >= 18) {
        echo json_encode(['success' => false, 'message' => 'Cannot add to a round that already has 18 holes']);
        exit;
    }
    
    // Normalize course names for comparison
    $normalizedExisting = trim($existingCourseName);
    $normalizedNew = trim($courseName);
    
    // Match by course name (date doesn't matter - can continue a round from any day)
    if ($normalizedExisting === $normalizedNew) {
        // Merge holes (append new holes that don't already exist)
        $existingHoles = $existingRound['holes'] ?? [];
        $newHoles = $roundData['holes'] ?? [];
        
        // Find the highest hole number in existing round
        $maxExistingHole = 0;
        foreach ($existingHoles as $hole) {
            if (isset($hole['holeNumber']) && $hole['holeNumber'] > $maxExistingHole) {
                $maxExistingHole = $hole['holeNumber'];
            }
        }
        
        // Add new holes (those beyond what we already have)
        foreach ($newHoles as $hole) {
            $holeNum = $hole['holeNumber'] ?? 0;
            if ($holeNum > $maxExistingHole) {
                $existingHoles[] = $hole;
            }
        }
        
        // Update the round with merged holes
        $existingRound['holes'] = $existingHoles;
        $existingRound['timestamp'] = date('Y-m-d H:i:s'); // Update timestamp
        $existingRound['lastUpdated'] = date('Y-m-d H:i:s');
        
        // Recalculate stats for merged round
        $totalHoles = count($existingHoles);
        $totalPar = array_sum(array_column($existingHoles, 'par'));
        $totalScore = array_sum(array_column($existingHoles, 'score'));
        $totalToPar = $totalScore - $totalPar;
        $girsHit = count(array_filter($existingHoles, function($h) { return !empty($h['gir']); }));
        $fairwaysHit = count(array_filter($existingHoles, function($h) { return !empty($h['fairway']) && ($h['par'] ?? 0) != 3; }));
        $eligibleFairways = count(array_filter($existingHoles, function($h) { return ($h['par'] ?? 0) != 3; }));
        $totalPutts = array_sum(array_column($existingHoles, 'putts'));
        
        $missedGirs = array_filter($existingHoles, function($h) { return empty($h['gir']); });
        $scrambles = count(array_filter($missedGirs, function($h) { 
            return isset($h['score']) && isset($h['par']) && $h['score'] <= $h['par']; 
        }));
        
        $penalties = count(array_filter($existingHoles, function($h) { 
            return isset($h['penalty']) && !empty($h['penalty']); 
        }));
        $totalPenaltyStrokes = array_sum(array_map(function($h) {
            if (!isset($h['penalty']) || empty($h['penalty'])) return 0;
            return ($h['penalty'] === 'wrong') ? 2 : 1;
        }, $existingHoles));
        
        $girHoles = array_filter($existingHoles, function($h) { return !empty($h['gir']); });
        $puttsOnGIR = array_sum(array_column($girHoles, 'putts'));
        $puttsPerGIR = count($girHoles) > 0 ? round($puttsOnGIR / count($girHoles), 2) : 0;
        
        $allApproaches = array_filter($existingHoles, function($h) { return isset($h['approachDistance']) && $h['approachDistance'] > 0; });
        $avgProximity = count($allApproaches) > 0 
            ? round(array_sum(array_column($allApproaches, 'approachDistance')) / count($allApproaches), 1)
            : 0;
        
        // Update stats
        $existingRound['stats'] = [
            'totalHoles' => $totalHoles,
            'totalScore' => $totalScore,
            'totalPar' => $totalPar,
            'toPar' => $totalToPar,
            'girsHit' => $girsHit,
            'totalGirs' => $totalHoles,
            'avgProximity' => $avgProximity,
            'fairwaysHit' => $fairwaysHit,
            'eligibleFairways' => $eligibleFairways,
            'totalPutts' => $totalPutts,
            'avgPutts' => $totalHoles > 0 ? round($totalPutts / $totalHoles, 2) : 0,
            'puttsPerGIR' => $puttsPerGIR,
            'scrambles' => $scrambles,
            'missedGirs' => count($missedGirs),
            'penalties' => $penalties,
            'totalPenaltyStrokes' => $totalPenaltyStrokes
        ];
        
        $result = file_put_contents($roundsFile, json_encode($rounds, JSON_PRETTY_PRINT));
        
        if ($result === false) {
            echo json_encode(['success' => false, 'message' => 'Failed to merge round']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Round updated successfully',
            'roundNumber' => $mergeIntoRoundId + 1,
            'totalRounds' => count($rounds),
            'merged' => true,
            'totalHoles' => $totalHoles
        ]);
        exit;
    } else {
        // Invalid merge - round doesn't exist, is complete, or different course/date
        echo json_encode(['success' => false, 'message' => 'Cannot merge into this round']);
        exit;
    }
}

// Create new round (not merging)
// Before creating, double-check if there's an incomplete round with this course name that we should merge into instead
if (empty($mergeIntoRoundId) || $mergeIntoRoundId === '') {
    // Look for incomplete rounds with same course name
    foreach ($rounds as $idx => $existingRound) {
        $existingHoleCount = count($existingRound['holes'] ?? []);
        $existingCourseName = trim($existingRound['courseName'] ?? '');
        
        // If we find an incomplete round with same course name, don't create duplicate
        if ($existingHoleCount < 18 && trim($existingCourseName) === trim($courseName)) {
            // Found matching incomplete round - should have been merged, but prevent duplicate anyway
            echo json_encode([
                'success' => false, 
                'message' => 'An incomplete round already exists for this course. Please use "Add to Existing Round" instead.',
                'existingRoundIndex' => $idx
            ]);
            exit;
        }
    }
}

$roundData['timestamp'] = date('Y-m-d H:i:s');
$roundData['date'] = $today;
$roundData['courseName'] = $courseName;
$roundData['roundNumber'] = count($rounds) + 1;

// Add round to array
$rounds[] = $roundData;

// Save back to file
$result = file_put_contents($roundsFile, json_encode($rounds, JSON_PRETTY_PRINT));

if ($result === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to save round']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Round saved successfully',
    'roundNumber' => $roundData['roundNumber'],
    'totalRounds' => count($rounds)
]);
?>

