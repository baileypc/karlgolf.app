<?php
/**
 * Karl's GIR - Admin Session Helpers
 */

require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/csrf.php';

function getAdminAuthStatus() {
    $isAdmin = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

    if ($isAdmin) {
        $timeout = 30 * 60;
        $lastActivity = $_SESSION['admin_last_activity'] ?? 0;

        if (time() - $lastActivity > $timeout) {
            unset($_SESSION['admin_logged_in']);
            unset($_SESSION['admin_username']);
            unset($_SESSION['admin_last_activity']);
            logInfo('Admin session expired due to inactivity');
            $isAdmin = false;
        } else {
            $_SESSION['admin_last_activity'] = time();
        }
    }

    return [
        'loggedIn' => $isAdmin,
        'username' => $isAdmin ? ($_SESSION['admin_username'] ?? 'admin') : null
    ];
}

function requireAdminAuth($requireCsrf = false) {
    $status = getAdminAuthStatus();
    if (!$status['loggedIn']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    if ($requireCsrf) {
        $expected = getCsrfToken();
        $provided = getRequestCsrfToken();

        if (!$provided || !hash_equals($expected, $provided)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Security token expired. Please refresh and try again.',
                'errorCode' => 'CSRF_TOKEN_INVALID'
            ]);
            exit;
        }
    }

    return $status;
}
?>
