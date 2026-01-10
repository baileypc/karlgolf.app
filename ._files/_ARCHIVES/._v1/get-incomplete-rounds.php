<?php
// Karl's GIR - Get Incomplete Rounds
// Returns rounds that are incomplete (< 18 holes) for the same course/date

// Configure session cookie before starting session
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

$userHash = $_SESSION['user_hash'];
$userDir = __DIR__ . '/data/' . $userHash;
$roundsFile = $userDir . '/rounds.json';

if (!file_exists($roundsFile)) {
    echo json_encode(['success' => true, 'incompleteRounds' => []]);
    exit;
}

$rounds = json_decode(file_get_contents($roundsFile), true) ?: [];

// Get course name from query if provided
$courseName = $_GET['courseName'] ?? '';

// Find incomplete rounds (less than 18 holes) - match by course name if provided, otherwise find all incomplete
$incompleteRounds = [];
foreach ($rounds as $index => $round) {
    $holeCount = count($round['holes'] ?? []);
    $roundDate = $round['date'] ?? '';
    $roundCourse = trim($round['courseName'] ?? '');
    
    // Skip rounds with empty course names
    if (empty($roundCourse)) {
        continue;
    }
    
    // Skip rounds that already have 18 holes
    if ($holeCount >= 18) {
        continue;
    }
    
    // If course name provided, only match that course
    if ($courseName && trim($roundCourse) !== trim($courseName)) {
        continue;
    }
    
    // Match incomplete rounds (< 18 holes)
    $incompleteRounds[] = [
        'index' => $index,
        'roundNumber' => $round['roundNumber'] ?? ($index + 1),
        'courseName' => $roundCourse,
        'date' => $roundDate,
        'holeCount' => $holeCount,
        'lastHoleNumber' => $holeCount > 0 ? max(array_column($round['holes'] ?? [], 'holeNumber')) : 0
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

