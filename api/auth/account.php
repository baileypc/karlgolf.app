<?php
/**
 * Karl's GIR - Account Settings Handler
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/cors.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/validation.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/csrf.php';
require_once __DIR__ . '/../common/data-path.php';
require_once __DIR__ . '/../common/profile.php';

initSession();

$auth = requireAuth();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$dataDir = getDataDirectory();

if ($dataDir === false) {
    logError('Failed to resolve data directory for account settings');
    echo json_encode(['success' => false, 'message' => 'Server configuration error']);
    exit;
}

$userHash = $auth['userHash'];
$userEmail = $auth['userEmail'] ?? '';
$userDir = $dataDir . '/' . $userHash;
$passwordFile = $userDir . '/password.txt';

function copyDirectoryRecursive($sourceDir, $targetDir) {
    if (!is_dir($sourceDir)) {
        return false;
    }

    if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
        return false;
    }

    $items = scandir($sourceDir);
    if ($items === false) {
        return false;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $sourcePath = $sourceDir . '/' . $item;
        $targetPath = $targetDir . '/' . $item;

        if (is_dir($sourcePath)) {
            if (!copyDirectoryRecursive($sourcePath, $targetPath)) {
                return false;
            }
            continue;
        }

        if (!copy($sourcePath, $targetPath)) {
            return false;
        }
    }

    return true;
}

function requireJsonBody() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!is_array($data)) {
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }

    return $data;
}

function readPasswordHash($passwordFile) {
    if (!file_exists($passwordFile)) {
        return null;
    }

    $hash = @file_get_contents($passwordFile);
    return is_string($hash) ? trim($hash) : null;
}

if ($action === 'get' && $method === 'GET') {
    $profile = readUserProfile($userDir, $userEmail);

    echo json_encode([
        'success' => true,
        'account' => [
            'email' => $profile['email'] ?: $userEmail,
            'username' => $profile['username'] ?? '',
        ],
        'csrfToken' => ($auth['authMethod'] ?? '') === 'session' ? getCsrfToken() : null,
    ]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

requireCsrfForSessionAuth($auth);
$data = requireJsonBody();

if ($action === 'update-username') {
    $usernameValidation = validateUsername($data['username'] ?? '');
    if (!$usernameValidation['valid']) {
        echo json_encode(['success' => false, 'message' => $usernameValidation['error']]);
        exit;
    }

    $profile = readUserProfile($userDir, $userEmail);
    $profile['username'] = $usernameValidation['sanitized'];
    $profile['email'] = $profile['email'] ?: $userEmail;
    $profile['updatedAt'] = date('c');

    if (!writeUserProfile($userDir, $profile)) {
        logError('Failed to write user profile', ['userHash' => $userHash]);
        echo json_encode(['success' => false, 'message' => 'Failed to update username']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Username updated',
        'account' => [
            'email' => $profile['email'],
            'username' => $profile['username'],
        ],
        'csrfToken' => ($auth['authMethod'] ?? '') === 'session' ? rotateCsrfToken() : null,
    ]);
    exit;
}

if ($action === 'update-email') {
    $newEmail = trim((string)($data['email'] ?? ''));
    if (!validateEmail($newEmail)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit;
    }

    $normalizedNewEmail = strtolower($newEmail);
    $newUserHash = hash('sha256', $normalizedNewEmail);
    $newUserDir = $dataDir . '/' . $newUserHash;

    $profile = readUserProfile($userDir, $userEmail);
    $currentEmail = trim((string)($profile['email'] ?: $userEmail));
    $normalizedCurrentEmail = strtolower($currentEmail);

    if ($normalizedCurrentEmail === $normalizedNewEmail) {
        $profile['email'] = $newEmail;
        $profile['updatedAt'] = date('c');
        writeUserProfile($userDir, $profile);
        $_SESSION['user_email'] = $newEmail;

        echo json_encode([
            'success' => true,
            'message' => 'Email updated',
            'account' => [
                'email' => $newEmail,
                'username' => $profile['username'] ?? '',
            ],
            'csrfToken' => ($auth['authMethod'] ?? '') === 'session' ? rotateCsrfToken() : null,
        ]);
        exit;
    }

    if (is_dir($newUserDir)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'An account with that email already exists']);
        exit;
    }

    $backupRoot = dirname($dataDir) . '/data-email-change-backups';
    if (!is_dir($backupRoot) && !mkdir($backupRoot, 0755, true)) {
        logError('Failed to create email change backup directory', ['backupRoot' => $backupRoot]);
        echo json_encode(['success' => false, 'message' => 'Could not update email']);
        exit;
    }

    $backupDir = $backupRoot . '/' . $userHash . '-' . gmdate('YmdHis');
    if (!rename($userDir, $backupDir)) {
        logError('Failed to move account folder to backup before email change', ['userHash' => $userHash, 'backupDir' => $backupDir]);
        echo json_encode(['success' => false, 'message' => 'Could not update email']);
        exit;
    }

    if (!copyDirectoryRecursive($backupDir, $newUserDir)) {
        @rename($backupDir, $userDir);
        logError('Failed to copy account folder during email change', ['userHash' => $userHash, 'newUserHash' => $newUserHash]);
        echo json_encode(['success' => false, 'message' => 'Could not update email']);
        exit;
    }

    if (!file_exists($newUserDir . '/password.txt') || !file_exists($newUserDir . '/rounds.json')) {
        @rename($backupDir, $userDir);
        logError('Email change verification failed', ['userHash' => $userHash, 'newUserHash' => $newUserHash]);
        echo json_encode(['success' => false, 'message' => 'Could not update email']);
        exit;
    }

    $profile = readUserProfile($newUserDir, $newEmail);
    $profile['email'] = $newEmail;
    $profile['updatedAt'] = date('c');

    if (!writeUserProfile($newUserDir, $profile)) {
        logError('Failed to write migrated profile during email change', ['newUserHash' => $newUserHash]);
        echo json_encode(['success' => false, 'message' => 'Could not update email']);
        exit;
    }

    $_SESSION['user_email'] = $newEmail;
    $_SESSION['user_hash'] = $newUserHash;

    logInfo('Account email updated', ['oldUserHash' => $userHash, 'newUserHash' => $newUserHash]);

    echo json_encode([
        'success' => true,
        'message' => 'Email updated',
        'account' => [
            'email' => $newEmail,
            'username' => $profile['username'] ?? '',
        ],
        'csrfToken' => ($auth['authMethod'] ?? '') === 'session' ? rotateCsrfToken() : null,
    ]);
    exit;
}

if ($action === 'update-password') {
    $currentPassword = $data['currentPassword'] ?? '';
    $newPassword = $data['newPassword'] ?? '';

    $storedHash = readPasswordHash($passwordFile);
    if (!$storedHash || !password_verify($currentPassword, $storedHash)) {
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        exit;
    }

    $passwordValidation = validatePassword($newPassword, 8);
    if (!$passwordValidation['valid']) {
        echo json_encode(['success' => false, 'message' => $passwordValidation['error']]);
        exit;
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $fp = fopen($passwordFile, 'c+');
    if (!$fp || !flock($fp, LOCK_EX)) {
        if ($fp) {
            fclose($fp);
        }
        logError('Failed to lock password file for update', ['userHash' => $userHash]);
        echo json_encode(['success' => false, 'message' => 'Failed to update password']);
        exit;
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $newHash);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    echo json_encode([
        'success' => true,
        'message' => 'Password updated',
        'csrfToken' => ($auth['authMethod'] ?? '') === 'session' ? rotateCsrfToken() : null,
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Unknown account action']);