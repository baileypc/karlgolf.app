<?php
/**
 * Admin Delete User API
 * Allows admin to delete a user account
 */

require_once __DIR__ . '/../common/environment.php';
require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/cors.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/admin-auth.php';

error_reporting(isDevelopment() ? E_ALL : 0);
ini_set('display_errors', '0');

initSession();

requireAdminAuth(true);

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['userHash']) || empty($input['userHash'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User hash is required']);
    exit;
}

$userHash = $input['userHash'];
if (!is_string($userHash) || !preg_match('/^[a-f0-9]{64}$/i', $userHash)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid user hash']);
    exit;
}

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

// Delete all user files
$filesToDelete = [
    $userDir . '/password.txt',
    $userDir . '/rounds.json',
    $userDir . '/current_round.json',
    $userDir . '/reset_token.json',
    $userDir . '/email.txt'
];

foreach ($filesToDelete as $file) {
    if (file_exists($file)) {
        @unlink($file);
    }
}

// Remove user directory
if (is_dir($userDir)) {
    // Remove any remaining files
    $files = glob($userDir . '/*');
    foreach ($files as $file) {
        if (is_file($file)) {
            @unlink($file);
        }
    }
    // Remove directory (suppress warnings - may fail on Windows if directory is locked)
    @rmdir($userDir);
}

logInfo('Admin deleted user', ['userHash' => $userHash]);

echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
