<?php
// Karl's GIR - Sync Current Unsaved Round
// Saves/loads the current in-progress round so it syncs across devices

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
$currentRoundFile = $userDir . '/current_round.json';

// Get action from request
$action = $_GET['action'] ?? 'get';

// GET: Load current round
if ($action === 'get') {
    if (file_exists($currentRoundFile)) {
        $data = json_decode(file_get_contents($currentRoundFile), true);
        if ($data && isset($data['holes'])) {
            echo json_encode([
                'success' => true,
                'holes' => $data['holes'] ?? [],
                'currentHole' => $data['currentHole'] ?? 1,
                'lastUpdated' => $data['lastUpdated'] ?? null
            ]);
        } else {
            echo json_encode(['success' => true, 'holes' => [], 'currentHole' => 1]);
        }
    } else {
        echo json_encode(['success' => true, 'holes' => [], 'currentHole' => 1]);
    }
    exit;
}

// POST: Save current round
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        exit;
    }
    
    // Ensure user directory exists
    if (!is_dir($userDir)) {
        mkdir($userDir, 0755, true);
    }
    
    // Save current round data
    $currentRoundData = [
        'holes' => $data['holes'] ?? [],
        'currentHole' => $data['currentHole'] ?? 1,
        'lastUpdated' => date('Y-m-d H:i:s')
    ];
    
    $result = file_put_contents($currentRoundFile, json_encode($currentRoundData, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        echo json_encode(['success' => false, 'message' => 'Failed to save current round']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Current round synced',
        'holes' => count($currentRoundData['holes']),
        'currentHole' => $currentRoundData['currentHole']
    ]);
    exit;
}

// DELETE: Clear current round
if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (file_exists($currentRoundFile)) {
        unlink($currentRoundFile);
    }
    echo json_encode(['success' => true, 'message' => 'Current round cleared']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>

