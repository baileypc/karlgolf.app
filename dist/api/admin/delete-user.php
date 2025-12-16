<?php
/**
 * Admin Delete User API
 * Allows admin to delete a user account
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// Log the deletion
error_log("Admin deleted user: $userHash");

echo json_encode(['success' => true, 'message' => 'User deleted successfully']);

