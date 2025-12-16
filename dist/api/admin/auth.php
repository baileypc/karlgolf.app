<?php
/**
 * Karl's GIR - Admin Authentication
 * Separate authentication system for admin dashboard
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/data-path.php';
require_once __DIR__ . '/../common/rate-limiter.php';

// Initialize session
initSession();

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Get action from GET, POST, or JSON data
$action = $_GET['action'] ?? ($_POST['action'] ?? ($data['action'] ?? ''));

// Admin credentials file
$dataDir = getDataDirectory();
$adminDir = $dataDir . '/admin';
if (!is_dir($adminDir)) {
    mkdir($adminDir, 0755, true);
}
$credentialsFile = $adminDir . '/admin_credentials.json';

// Initialize admin credentials if they don't exist
if (!file_exists($credentialsFile)) {
    // Username: karl, Password: +1 867-5309 Jenny
    $adminCredentials = [
        'username' => 'karl',
        'passwordHash' => password_hash('+1 867-5309 Jenny', PASSWORD_DEFAULT)
    ];
    writeJsonFile($credentialsFile, $adminCredentials);
}

// Check if admin is logged in
if ($action === 'check') {
    $isAdmin = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

    // Check session timeout (30 minutes of inactivity)
    if ($isAdmin) {
        $timeout = 30 * 60; // 30 minutes in seconds
        $lastActivity = $_SESSION['admin_last_activity'] ?? 0;

        if (time() - $lastActivity > $timeout) {
            // Session expired
            unset($_SESSION['admin_logged_in']);
            unset($_SESSION['admin_username']);
            unset($_SESSION['admin_last_activity']);
            logInfo('Admin session expired due to inactivity');
            $isAdmin = false;
        } else {
            // Update last activity time
            $_SESSION['admin_last_activity'] = time();
        }
    }

    echo json_encode([
        'loggedIn' => $isAdmin,
        'username' => $isAdmin ? ($_SESSION['admin_username'] ?? 'admin') : null
    ]);
    exit;
}

// Logout
if ($action === 'logout') {
    unset($_SESSION['admin_logged_in']);
    unset($_SESSION['admin_username']);
    session_destroy();
    logInfo('Admin logged out');
    echo json_encode(['success' => true]);
    exit;
}

// Login
if ($action === 'login') {
    // Rate limiting for admin login (stricter than regular login)
    $rateLimit = checkRateLimit('admin-login', 3, 15);
    
    if (!$rateLimit['allowed']) {
        http_response_code(429);
        logWarning('Admin login rate limit exceeded');
        echo json_encode([
            'success' => false,
            'message' => $rateLimit['message'],
            'retryAfter' => $rateLimit['retryAfter']
        ]);
        exit;
    }

    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }

    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password required']);
        exit;
    }
    
    // Load admin credentials
    $credentials = readJsonFile($credentialsFile, null);
    
    if (!$credentials) {
        logError('Admin credentials file not found or invalid');
        echo json_encode(['success' => false, 'message' => 'Authentication error']);
        exit;
    }
    
    // Verify credentials
    if ($username === $credentials['username'] && password_verify($password, $credentials['passwordHash'])) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $username;
        $_SESSION['admin_last_activity'] = time(); // Set initial activity time

        // Regenerate session ID for security
        session_regenerate_id(true);

        logInfo('Admin logged in', ['username' => $username]);
        echo json_encode(['success' => true, 'message' => 'Login successful']);
    } else {
        logWarning('Admin login attempt failed', ['username' => $username]);
        echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>

