<?php
// Karl's GIR - Get List of Course Names
// Returns all unique course names from user's saved rounds

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
$roundsFile = __DIR__ . '/data/' . $userHash . '/rounds.json';

if (!file_exists($roundsFile)) {
    echo json_encode(['success' => true, 'courseNames' => []]);
    exit;
}

$rounds = json_decode(file_get_contents($roundsFile), true) ?: [];

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

