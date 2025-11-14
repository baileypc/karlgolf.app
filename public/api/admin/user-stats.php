<?php
/**
 * Admin User Stats API
 * Get detailed stats for a specific user
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session
session_start();

// Check if admin is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get user hash from query parameter
if (!isset($_GET['userHash']) || empty($_GET['userHash'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User hash is required']);
    exit;
}

$userHash = $_GET['userHash'];

// Get data directory
require_once __DIR__ . '/../common/data-path.php';
$dataDir = getDataDirectory();
$userDir = $dataDir . '/' . $userHash;

// Verify user directory exists
if (!is_dir($userDir)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

// Get user email
$email = null;
$emailFile = $userDir . '/email.txt';
if (file_exists($emailFile)) {
    $email = trim(file_get_contents($emailFile));
}

// Get user rounds
$roundsFile = $userDir . '/rounds.json';
$rounds = [];
if (file_exists($roundsFile)) {
    $roundsData = file_get_contents($roundsFile);
    $rounds = json_decode($roundsData, true) ?: [];
}

// Calculate stats
$totalRounds = count($rounds);
$totalHoles = 0;
$totalGIR = 0;
$totalFairways = 0;
$totalPutts = 0;
$totalScore = 0;
$totalPar = 0;
$par3Count = 0;
$par4Count = 0;
$par5Count = 0;
$courses = [];

foreach ($rounds as $round) {
    if (!isset($round['holes']) || !is_array($round['holes'])) continue;
    
    $courseName = $round['courseName'] ?? 'Unknown Course';
    if (!isset($courses[$courseName])) {
        $courses[$courseName] = 0;
    }
    $courses[$courseName]++;
    
    foreach ($round['holes'] as $hole) {
        $totalHoles++;
        
        // GIR
        if (isset($hole['gir']) && strtolower($hole['gir']) === 'y') {
            $totalGIR++;
        }
        
        // Fairway (only for par 4 and 5)
        $par = intval($hole['par'] ?? 0);
        if ($par >= 4 && isset($hole['fairway']) && strtolower($hole['fairway']) === 'y') {
            $totalFairways++;
        }
        
        // Putts
        if (isset($hole['putts'])) {
            $totalPutts += intval($hole['putts']);
        }
        
        // Score
        if (isset($hole['score'])) {
            $totalScore += intval($hole['score']);
        }
        
        // Par
        $totalPar += $par;
        
        // Par counts
        if ($par === 3) $par3Count++;
        elseif ($par === 4) $par4Count++;
        elseif ($par === 5) $par5Count++;
    }
}

// Calculate percentages and averages
$girPercentage = $totalHoles > 0 ? round(($totalGIR / $totalHoles) * 100, 1) : 0;
$fairwayCount = $par4Count + $par5Count;
$fairwayPercentage = $fairwayCount > 0 ? round(($totalFairways / $fairwayCount) * 100, 1) : 0;
$avgPuttsPerHole = $totalHoles > 0 ? round($totalPutts / $totalHoles, 2) : 0;
$avgScorePerHole = $totalHoles > 0 ? round($totalScore / $totalHoles, 2) : 0;
$avgParPerHole = $totalHoles > 0 ? round($totalPar / $totalHoles, 2) : 0;
$avgScoreToPar = $totalHoles > 0 ? round(($totalScore - $totalPar) / $totalHoles, 2) : 0;

// Get signup date
$signupDate = null;
$passwordFile = $userDir . '/password.txt';
if (file_exists($passwordFile)) {
    $signupDate = date('Y-m-d H:i:s', filemtime($passwordFile));
}

// Get last activity
$lastActivity = null;
if (file_exists($roundsFile)) {
    $lastActivity = date('Y-m-d H:i:s', filemtime($roundsFile));
}

// Sort courses by play count
arsort($courses);

// Return stats
echo json_encode([
    'success' => true,
    'user' => [
        'userHash' => $userHash,
        'email' => $email,
        'signupDate' => $signupDate,
        'lastActivity' => $lastActivity
    ],
    'stats' => [
        'totalRounds' => $totalRounds,
        'totalHoles' => $totalHoles,
        'girPercentage' => $girPercentage,
        'fairwayPercentage' => $fairwayPercentage,
        'avgPuttsPerHole' => $avgPuttsPerHole,
        'avgScorePerHole' => $avgScorePerHole,
        'avgParPerHole' => $avgParPerHole,
        'avgScoreToPar' => $avgScoreToPar,
        'totalGIR' => $totalGIR,
        'totalFairways' => $totalFairways,
        'totalPutts' => $totalPutts,
        'totalScore' => $totalScore,
        'totalPar' => $totalPar,
        'par3Count' => $par3Count,
        'par4Count' => $par4Count,
        'par5Count' => $par5Count
    ],
    'courses' => $courses,
    'rounds' => array_map(function($round) {
        return [
            'courseName' => $round['courseName'] ?? 'Unknown',
            'date' => $round['date'] ?? null,
            'holeCount' => count($round['holes'] ?? [])
        ];
    }, $rounds)
]);

