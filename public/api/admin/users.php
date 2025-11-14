<?php
/**
 * Karl's GIR - Admin Users API
 * Returns list of all registered users with email and user hash
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/data-path.php';

// Initialize session
initSession();

// Check admin authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Get data directory (auto-detects local vs production)
$dataDir = getDataDirectory();
$users = [];

// Scan data directory for user folders
if (is_dir($dataDir)) {
    $dirs = scandir($dataDir);
    
    foreach ($dirs as $dir) {
        // Skip . and .. and admin directory
        if ($dir === '.' || $dir === '..' || $dir === 'admin') {
            continue;
        }
        
        $userDir = $dataDir . '/' . $dir;
        
        // Check if it's a directory and has a password.txt file (registered user)
        if (is_dir($userDir) && file_exists($userDir . '/password.txt')) {
            $userHash = $dir;
            
            // Try to get email from analytics signups (where it's tracked)
            $email = null;
            $analyticsFile = $dataDir . '/admin/analytics.json';
            if (file_exists($analyticsFile)) {
                $analyticsData = readJsonFile($analyticsFile, []);
                $signups = $analyticsData['signups'] ?? [];
                // Find signup with matching userHash
                foreach ($signups as $signup) {
                    if (($signup['userHash'] ?? '') === $userHash) {
                        // Check if email is stored in signup data
                        if (isset($signup['email']) && !empty($signup['email'])) {
                            $email = $signup['email'];
                        }
                        break;
                    }
                }
            }
            
            // Fallback: Try to get email from rounds.json metadata
            if (!$email) {
                $roundsFile = $userDir . '/rounds.json';
                if (file_exists($roundsFile)) {
                    $roundsData = readJsonFile($roundsFile, []);
                    if (isset($roundsData['_metadata']['email']) && !empty($roundsData['_metadata']['email'])) {
                        $email = $roundsData['_metadata']['email'];
                    }
                }
            }
            
            // Additional fallback: Try to reverse hash (not possible, but check if userHash matches any known email hash)
            // Note: SHA256 is one-way, but we can check all signups to see if any email hashes match
            if (!$email) {
                $analyticsFileFallback = $dataDir . '/admin/analytics.json';
                if (file_exists($analyticsFileFallback)) {
                    $analyticsData = readJsonFile($analyticsFileFallback, []);
                    $signups = $analyticsData['signups'] ?? [];
                    foreach ($signups as $signup) {
                        if (isset($signup['email']) && !empty($signup['email'])) {
                            $emailHash = hash('sha256', strtolower($signup['email']));
                            if ($emailHash === $userHash) {
                                $email = $signup['email'];
                                break;
                            }
                        }
                    }
                }
            }
            
            // Get user stats
            $roundsCount = 0;
            $lastActivity = null;
            
            if (file_exists($roundsFile)) {
                $roundsData = readJsonFile($roundsFile, []);
                if (is_array($roundsData)) {
                    // Filter out metadata
                    $actualRounds = array_filter($roundsData, function($item) {
                        return isset($item['roundNumber']);
                    });
                    $roundsCount = count($actualRounds);
                    
                    // Get last activity from most recent round
                    if ($roundsCount > 0) {
                        $rounds = array_values($actualRounds);
                        usort($rounds, function($a, $b) {
                            return ($b['roundNumber'] ?? 0) - ($a['roundNumber'] ?? 0);
                        });
                        $lastActivity = $rounds[0]['date'] ?? null;
                    }
                }
            }
            
            // Get signup date from analytics if available
            $signupDate = null;
            $analyticsFileSignup = $dataDir . '/admin/analytics.json';
            if (file_exists($analyticsFileSignup)) {
                $analyticsData = readJsonFile($analyticsFileSignup, []);
                $signups = $analyticsData['signups'] ?? [];
                foreach ($signups as $signup) {
                    if (($signup['userHash'] ?? '') === $userHash) {
                        $signupDate = $signup['timestamp'] ?? null;
                        break;
                    }
                }
            }
            
            $users[] = [
                'userHash' => $userHash,
                'email' => $email, // May be null if not stored
                'roundsCount' => $roundsCount,
                'signupDate' => $signupDate,
                'lastActivity' => $lastActivity
            ];
        }
    }
}

// Sort by signup date (most recent first)
usort($users, function($a, $b) {
    $dateA = $a['signupDate'] ?? '';
    $dateB = $b['signupDate'] ?? '';
    if ($dateA && $dateB) {
        return strtotime($dateB) - strtotime($dateA);
    }
    if ($dateA) return -1;
    if ($dateB) return 1;
    return 0;
});

echo json_encode([
    'success' => true,
    'users' => $users,
    'totalUsers' => count($users)
]);
?>

