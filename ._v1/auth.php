<?php
// Karl's GIR - Authentication Handler
// File-based authentication (no database)

// Configure session cookie before starting session
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_lifetime', '0'); // Session cookie (expires when browser closes)

// Set session cookie parameters explicitly
// Detect if we're on HTTPS
$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
            (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $isSecure, // Use secure cookies only on HTTPS
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();
header('Content-Type: application/json');

// Get JSON input for POST requests first (for actions sent in JSON body)
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Get action from GET, POST, or JSON data
$action = $_GET['action'] ?? ($_POST['action'] ?? ($data['action'] ?? ''));

// Check if user is logged in
if ($action === 'check') {
    echo json_encode([
        'loggedIn' => isset($_SESSION['user_email']),
        'email' => $_SESSION['user_email'] ?? null
    ]);
    exit;
}

// Logout
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Reset Dashboard (delete all rounds)
if ($action === 'reset-dashboard') {
    // Check if user is logged in
    if (!isset($_SESSION['user_email']) || !isset($_SESSION['user_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
        exit;
    }
    
    $userHash = $_SESSION['user_hash'];
    $roundsFile = __DIR__ . '/data/' . $userHash . '/rounds.json';
    
    // Delete rounds file (or create empty array)
    file_put_contents($roundsFile, json_encode([]));
    
    echo json_encode(['success' => true, 'message' => 'Dashboard reset successfully']);
    exit;
}

// For actions that require JSON data, validate it exists
if (in_array($action, ['register', 'login', 'forgot-password', 'validate-token', 'reset-password'])) {
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }
}

$email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';

if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Hash email for directory name
$emailHash = hash('sha256', strtolower($email));
$userDir = $dataDir . '/' . $emailHash;

if ($action === 'register') {
    // Validate password
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }

    // Check if user already exists
    if (is_dir($userDir) && file_exists($userDir . '/password.txt')) {
        echo json_encode(['success' => false, 'message' => 'Account already exists']);
        exit;
    }

    // Create user directory
    if (!is_dir($userDir)) {
        mkdir($userDir, 0755, true);
    }

    // Hash and save password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    file_put_contents($userDir . '/password.txt', $passwordHash);

    // Initialize empty rounds file
    file_put_contents($userDir . '/rounds.json', json_encode([]));

    // Create session
    $_SESSION['user_email'] = $email;
    $_SESSION['user_hash'] = $emailHash;

    echo json_encode(['success' => true, 'message' => 'Account created successfully']);
    exit;
}

if ($action === 'login') {
    // Check if user directory exists
    if (!is_dir($userDir) || !file_exists($userDir . '/password.txt')) {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    // Verify password
    $storedHash = file_get_contents($userDir . '/password.txt');
    if (!password_verify($password, $storedHash)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    // Create session
    $_SESSION['user_email'] = $email;
    $_SESSION['user_hash'] = $emailHash;
    
    // Regenerate session ID for security after login
    // This also forces the session to be saved and the cookie to be sent
    session_regenerate_id(true);

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
    
    // Save token to file
    $tokenData = [
        'token' => $token,
        'expires' => $expires,
        'email' => $email
    ];
    file_put_contents($userDir . '/reset_token.json', json_encode($tokenData));

    // Send reset email
    require_once __DIR__ . '/send-password-reset.php';
    $emailSent = sendPasswordResetEmail($email, $token);

    if ($emailSent) {
        echo json_encode(['success' => true, 'message' => 'Password reset link sent']);
    } else {
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

    $tokenData = json_decode(file_get_contents($userDir . '/reset_token.json'), true);
    
    if (!$tokenData || $tokenData['token'] !== $token || $tokenData['expires'] < time()) {
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

    // Validate password length
    if (strlen($newPassword) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }

    // Check if user directory exists
    if (!is_dir($userDir) || !file_exists($userDir . '/reset_token.json')) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }

    $tokenData = json_decode(file_get_contents($userDir . '/reset_token.json'), true);
    
    if (!$tokenData || $tokenData['token'] !== $token || $tokenData['expires'] < time()) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }

    // Update password
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    file_put_contents($userDir . '/password.txt', $passwordHash);

    // Delete reset token
    unlink($userDir . '/reset_token.json');

    echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>

