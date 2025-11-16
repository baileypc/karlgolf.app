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
require_once __DIR__ . '/../common/rate-limiter.php';
require_once __DIR__ . '/welcome-email.php';

// Initialize session
initSession();

// Prevent caching of authentication responses
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Get JSON input for POST requests first (for actions sent in JSON body)
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Get action from GET, POST, or JSON data
$action = $_GET['action'] ?? ($_POST['action'] ?? ($data['action'] ?? ''));

// Check if user is logged in
if ($action === 'check') {
    $auth = checkAuth();
    // Debug logging
    error_log('🔍 Auth Check - Session ID: ' . session_id());
    error_log('🔍 Auth Check - Session data: ' . json_encode($_SESSION));
    error_log('🔍 Auth Check - Result: ' . json_encode($auth));
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
    require_once __DIR__ . '/../common/data-path.php';
    $auth = requireAuth();
    $userHash = $auth['userHash'];
    $dataDir = getDataDirectory();
    $userDir = $dataDir . '/' . $userHash;
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

// Rate limiting for authentication actions
if (in_array($action, ['login', 'register', 'forgot-password', 'reset-password'])) {
    $rateLimitConfig = [
        'login' => ['maxAttempts' => 5, 'windowMinutes' => 15],
        'register' => ['maxAttempts' => 3, 'windowMinutes' => 60],
        'forgot-password' => ['maxAttempts' => 3, 'windowMinutes' => 60],
        'reset-password' => ['maxAttempts' => 5, 'windowMinutes' => 15]
    ];

    $config = $rateLimitConfig[$action];
    $rateLimit = checkRateLimit($action, $config['maxAttempts'], $config['windowMinutes']);

    if (!$rateLimit['allowed']) {
        http_response_code(429); // Too Many Requests
        echo json_encode([
            'success' => false,
            'message' => $rateLimit['message'],
            'retryAfter' => $rateLimit['retryAfter']
        ]);
        exit;
    }
}

// Get data directory (handles both local and production paths)
require_once __DIR__ . '/../common/data-path.php';
$dataDir = getDataDirectory();
if ($dataDir === false) {
    logError('Failed to get data directory');
    echo json_encode(['success' => false, 'message' => 'Server configuration error']);
    exit;
}

// Validate email and set up user directory (only for actions that require email in request body)
// Actions like 'delete-account' and 'reset-dashboard' get email from session
if (in_array($action, ['register', 'login', 'forgot-password', 'validate-token', 'reset-password'])) {
    $email = $data['email'] ?? '';
    if (!validateEmail($email)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit;
    }

    // Hash email for directory name
    $emailHash = hash('sha256', strtolower($email));
    $userDir = $dataDir . '/' . $emailHash;
}

if ($action === 'register') {
    $password = $data['password'] ?? '';

    // Validate password (minimum 8 characters)
    $passwordValidation = validatePassword($password, 8);
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
        $mkdirResult = @mkdir($userDir, 0755, true);
        if (!$mkdirResult) {
            $error = error_get_last();
            logError('Failed to create user directory during registration', [
                'email' => $email,
                'userDir' => $userDir,
                'error' => $error ? $error['message'] : 'Unknown error',
                'dataDirWritable' => is_writable($dataDir)
            ]);
            echo json_encode(['success' => false, 'message' => 'Failed to create account directory']);
            exit;
        }
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
        $error = error_get_last();
        logError('Failed to save password during registration', [
            'email' => $email,
            'passwordFile' => $passwordFile,
            'userDirWritable' => is_writable($userDir),
            'error' => $error ? $error['message'] : 'File lock failed'
        ]);
        echo json_encode(['success' => false, 'message' => 'Failed to save password']);
        exit;
    }

    // Initialize empty rounds file with file locking
    if (!writeJsonFile($userDir . '/rounds.json', [])) {
        logError('Failed to initialize rounds file during registration', [
            'email' => $email,
            'userDir' => $userDir,
            'userDirWritable' => is_writable($userDir)
        ]);
        echo json_encode(['success' => false, 'message' => 'Failed to initialize account data']);
        exit;
    }

    // Create session
    $_SESSION['user_email'] = $email;
    $_SESSION['user_hash'] = $emailHash;
    
    // Track signup for analytics (pass email so admin can see it)
    trackSignup($emailHash, $email);

    // Send welcome email (non-blocking - don't fail registration if email fails)
    try {
        sendWelcomeEmail($email);
        logInfo('Welcome email sent to new user', ['email' => $email]);
    } catch (Exception $e) {
        logWarning('Failed to send welcome email', [
            'email' => $email,
            'error' => $e->getMessage()
        ]);
        // Continue with registration even if email fails
    }

    logInfo('New user registered successfully', [
        'email' => $email,
        'userDir' => $userDir,
        'passwordFileExists' => file_exists($passwordFile),
        'roundsFileExists' => file_exists($userDir . '/rounds.json')
    ]);
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

    // Debug logging
    error_log('🔍 Login Success - Session ID: ' . session_id());
    error_log('🔍 Login Success - Session data: ' . json_encode($_SESSION));

    logInfo('User logged in', ['email' => $email]);
    echo json_encode(['success' => true, 'message' => 'Login successful']);
    exit;
}

if ($action === 'forgot-password') {
    // Check if user exists
    if (!is_dir($userDir) || !file_exists($userDir . '/password.txt')) {
        // Return specific error code so frontend can show appropriate message
        echo json_encode([
            'success' => false, 
            'message' => 'No account found with that email address.',
            'errorCode' => 'ACCOUNT_NOT_FOUND'
        ]);
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
    require_once __DIR__ . '/password-reset.php';
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

    // Validate password (minimum 8 characters)
    $passwordValidation = validatePassword($newPassword, 8);
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

// Delete Account
if ($action === 'delete-account') {
    // Require authentication
    $auth = requireAuth();
    $userHash = $auth['userHash'];
    $userEmail = $auth['userEmail'];

    // Get data directory and user directory
    require_once __DIR__ . '/../common/data-path.php';
    $dataDir = getDataDirectory();
    $userDir = $dataDir . '/' . $userHash;
    
    // Verify user directory exists
    if (!is_dir($userDir)) {
        logError('Delete account attempt - user directory not found', ['userHash' => $userHash]);
        echo json_encode(['success' => false, 'message' => 'Account not found']);
        exit;
    }
    
    // Delete all user files
    $filesToDelete = [
        $userDir . '/password.txt',
        $userDir . '/rounds.json',
        $userDir . '/current_round.json',
        $userDir . '/reset_token.json'
    ];
    
    foreach ($filesToDelete as $file) {
        if (file_exists($file)) {
            unlink($file);
        }
    }
    
    // Remove user directory
    if (is_dir($userDir)) {
        // Remove any remaining files
        $files = glob($userDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                @unlink($file); // Suppress warnings
            }
        }
        // Remove directory (suppress warnings - may fail on Windows if directory is locked)
        @rmdir($userDir);
    }

    // Destroy session
    session_destroy();

    logInfo('Account deleted', ['email' => $userEmail, 'userHash' => $userHash]);
    echo json_encode(['success' => true, 'message' => 'Account deleted successfully']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
