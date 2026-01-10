<?php
/**
 * Karl's GIR - Authentication Handler
 * File-based authentication (no database)
 * Uses shared components for session, file locking, validation, and logging
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/validation.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/analytics-tracker.php';

// Initialize session
initSession();

// Get JSON input for POST requests first (for actions sent in JSON body)
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Get action from GET, POST, or JSON data
$action = $_GET['action'] ?? ($_POST['action'] ?? ($data['action'] ?? ''));

// Check if user is logged in
if ($action === 'check') {
    $auth = checkAuth();
    echo json_encode([
        'loggedIn' => $auth['loggedIn'],
        'email' => $auth['userEmail']
    ]);
    exit;
}

// Logout
if ($action === 'logout') {
    session_destroy();
    logInfo('User logged out');
    echo json_encode(['success' => true]);
    exit;
}

// Reset Dashboard (delete all rounds)
if ($action === 'reset-dashboard') {
    $auth = requireAuth();
    $userHash = $auth['userHash'];
    $userDir = __DIR__ . '/../../data/' . $userHash;
    $roundsFile = $userDir . '/rounds.json';
    $currentRoundFile = $userDir . '/current_round.json';
    
    // Clear rounds file with file locking
    if (!writeJsonFile($roundsFile, [])) {
        logError('Failed to reset dashboard', ['userHash' => $userHash]);
        echo json_encode(['success' => false, 'message' => 'Failed to reset dashboard']);
        exit;
    }
    
    // Also delete current_round.json if it exists
    if (file_exists($currentRoundFile)) {
        unlink($currentRoundFile);
    }
    
    logInfo('Dashboard reset', ['userHash' => $userHash]);
    echo json_encode(['success' => true, 'message' => 'Dashboard reset successfully']);
    exit;
}

// For actions that require JSON data, validate it exists
if (in_array($action, ['register', 'login', 'forgot-password', 'validate-token', 'reset-password'])) {
    if (!$data) {
        logWarning('Invalid request - missing JSON data', ['action' => $action]);
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }
}

// Validate email
$email = $data['email'] ?? '';
if (!validateEmail($email)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/../../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Hash email for directory name
$emailHash = hash('sha256', strtolower($email));
$userDir = $dataDir . '/' . $emailHash;

if ($action === 'register') {
    $password = $data['password'] ?? '';
    
    // Validate password
    $passwordValidation = validatePassword($password, 6);
    if (!$passwordValidation['valid']) {
        echo json_encode(['success' => false, 'message' => $passwordValidation['error']]);
        exit;
    }

    // Check if user already exists
    if (is_dir($userDir) && file_exists($userDir . '/password.txt')) {
        logWarning('Registration attempt for existing account', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Account already exists']);
        exit;
    }

    // Create user directory
    if (!is_dir($userDir)) {
        mkdir($userDir, 0755, true);
    }

    // Hash and save password (text file, not JSON)
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $passwordFile = $userDir . '/password.txt';
    $fp = fopen($passwordFile, 'c+');
    if ($fp && flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, $passwordHash);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    } else {
        logError('Failed to save password during registration', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Failed to create account']);
        exit;
    }

    // Initialize empty rounds file with file locking
    if (!writeJsonFile($userDir . '/rounds.json', [])) {
        logError('Failed to initialize rounds file during registration', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Failed to create account']);
        exit;
    }

    // Create session
    $_SESSION['user_email'] = $email;
    $_SESSION['user_hash'] = $emailHash;
    
    // Track signup for analytics
    trackSignup($emailHash);
    
    logInfo('New user registered', ['email' => $email]);
    echo json_encode(['success' => true, 'message' => 'Account created successfully']);
    exit;
}

if ($action === 'login') {
    $password = $data['password'] ?? '';
    
    // Check if user directory exists
    if (!is_dir($userDir) || !file_exists($userDir . '/password.txt')) {
        logWarning('Login attempt with invalid email', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    // Verify password (text file, not JSON)
    $passwordFile = $userDir . '/password.txt';
    $fp = fopen($passwordFile, 'r');
    if ($fp && flock($fp, LOCK_SH)) {
        $storedHash = file_get_contents($passwordFile);
        flock($fp, LOCK_UN);
        fclose($fp);
    } else {
        $storedHash = file_get_contents($passwordFile);
    }
    
    if (!password_verify($password, $storedHash)) {
        logWarning('Login attempt with invalid password', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    // Create session
    $_SESSION['user_email'] = $email;
    $_SESSION['user_hash'] = $emailHash;
    
    // Regenerate session ID for security after login
    session_regenerate_id(true);
    
    logInfo('User logged in', ['email' => $email]);
    echo json_encode(['success' => true, 'message' => 'Login successful']);
    exit;
}

if ($action === 'forgot-password') {
    // Check if user exists
    if (!is_dir($userDir) || !file_exists($userDir . '/password.txt')) {
        // Don't reveal if email exists or not for security
        echo json_encode(['success' => true, 'message' => 'If an account exists, a password reset link has been sent.']);
        exit;
    }

    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expires = time() + (60 * 60); // 1 hour expiry
    
    // Save token to file with file locking
    $tokenData = [
        'token' => $token,
        'expires' => $expires,
        'email' => $email
    ];
    
    if (!writeJsonFile($userDir . '/reset_token.json', $tokenData)) {
        logError('Failed to save reset token', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Failed to generate reset token']);
        exit;
    }

    // Send reset email
    require_once __DIR__ . '/send-password-reset.php';
    $emailSent = sendPasswordResetEmail($email, $token);

    if ($emailSent) {
        logInfo('Password reset email sent', ['email' => $email]);
        echo json_encode(['success' => true, 'message' => 'Password reset link sent']);
    } else {
        logError('Failed to send password reset email', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Failed to send reset email']);
    }
    exit;
}

if ($action === 'validate-token') {
    $token = $data['token'] ?? '';
    
    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit;
    }

    // Check if user directory exists
    if (!is_dir($userDir) || !file_exists($userDir . '/reset_token.json')) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }

    $tokenData = readJsonFile($userDir . '/reset_token.json', null);
    
    if (!$tokenData || !isset($tokenData['token']) || $tokenData['token'] !== $token || $tokenData['expires'] < time()) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'Token valid']);
    exit;
}

if ($action === 'reset-password') {
    $token = $data['token'] ?? '';
    $newPassword = $data['password'] ?? '';
    
    if (empty($token) || empty($newPassword)) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    // Validate password
    $passwordValidation = validatePassword($newPassword, 6);
    if (!$passwordValidation['valid']) {
        echo json_encode(['success' => false, 'message' => $passwordValidation['error']]);
        exit;
    }

    // Check if user directory exists
    if (!is_dir($userDir) || !file_exists($userDir . '/reset_token.json')) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }

    $tokenData = readJsonFile($userDir . '/reset_token.json', null);
    
    if (!$tokenData || !isset($tokenData['token']) || $tokenData['token'] !== $token || $tokenData['expires'] < time()) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }

    // Update password (text file, not JSON)
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $passwordFile = $userDir . '/password.txt';
    $fp = fopen($passwordFile, 'c+');
    if ($fp && flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, $passwordHash);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    } else {
        logError('Failed to update password', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Failed to reset password']);
        exit;
    }

    // Delete reset token
    if (file_exists($userDir . '/reset_token.json')) {
        unlink($userDir . '/reset_token.json');
    }
    
    logInfo('Password reset successful', ['email' => $email]);
    echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
