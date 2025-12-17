<?php
/**
 * Karl's GIR - Get List of Course Names
 * Returns all unique course names from user's saved rounds
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
$roundsFile = $dataDir . '/' . $userHash . '/rounds.json';

// Load rounds with file locking
$rounds = readJsonFile($roundsFile, []);

// Get unique course names (sorted alphabetically)
$courseNames = [];
foreach ($rounds as $round) {
    $courseName = $round['courseName'] ?? '';
    if ($courseName && $courseName !== 'Unnamed Course' && trim($courseName) !== '') {
        $courseNames[trim($courseName)] = true; // Use as key to ensure uniqueness
    }
}

// Sort and return as array
$uniqueCourseNames = array_keys($courseNames);
sort($uniqueCourseNames);

echo json_encode([
    'success' => true,
    'courseNames' => $uniqueCourseNames
]);
?>
