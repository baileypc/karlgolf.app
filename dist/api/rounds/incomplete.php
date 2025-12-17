<?php
/**
 * Karl's GIR - Get Incomplete Rounds
 * Returns rounds that are incomplete (< 18 holes) for the same course/date
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
$roundsFile = $userDir . '/rounds.json';

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Load rounds with file locking
$rounds = readJsonFile($roundsFile, []);

// Get course name from query if provided
$courseName = $_GET['courseName'] ?? '';

// Find incomplete rounds (less than 18 holes, but at least 1 hole)
$incompleteRounds = [];
foreach ($rounds as $index => $round) {
    // Validate round structure
    if (!is_array($round)) {
        continue;
    }
    
    $holeCount = count($round['holes'] ?? []);
    $roundDate = $round['date'] ?? '';
    $roundCourse = trim($round['courseName'] ?? '');
    
    // Skip rounds with empty course names
    if (empty($roundCourse)) {
        continue;
    }
    
    // Skip rounds with 0 holes (empty rounds shouldn't be considered incomplete)
    if ($holeCount === 0) {
        continue;
    }
    
    // Skip rounds that already have 18 or more holes (complete rounds)
    if ($holeCount >= 18) {
        continue;
    }
    
    // If course name provided, match that course (case-insensitive, trimmed)
    if ($courseName) {
        $normalizedRoundCourse = strtolower(trim($roundCourse));
        $normalizedCourseName = strtolower(trim($courseName));
        if ($normalizedRoundCourse !== $normalizedCourseName) {
            continue;
        }
    }
    
    // Validate holes array exists and has data
    $holes = $round['holes'] ?? [];
    if (!is_array($holes) || empty($holes)) {
        continue;
    }
    
    // Calculate last hole number safely
    $lastHoleNumber = 0;
    if (!empty($holes)) {
        $holeNumbers = array_column($holes, 'holeNumber');
        $holeNumbers = array_filter($holeNumbers, function($n) { return is_numeric($n); });
        $lastHoleNumber = !empty($holeNumbers) ? max($holeNumbers) : $holeCount;
    }
    
    // Match incomplete rounds (< 18 holes, >= 1 hole)
    // Include full holes array so client can load the round data
    $incompleteRounds[] = [
        'index' => $index,
        'roundNumber' => $round['roundNumber'] ?? ($index + 1),
        'courseName' => $roundCourse,
        'date' => $roundDate,
        'holeCount' => $holeCount,
        'lastHoleNumber' => $lastHoleNumber,
        'holes' => $holes // Include full hole data for client to load
    ];
}

// Sort by most recent (highest index)
usort($incompleteRounds, function($a, $b) {
    return $b['index'] - $a['index'];
});

echo json_encode([
    'success' => true,
    'incompleteRounds' => $incompleteRounds
]);
?>
