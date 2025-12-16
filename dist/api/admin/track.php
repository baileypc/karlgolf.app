<?php
/**
 * Karl's GIR - Analytics Tracking Endpoint
 * Receives tracking events from the frontend
 */

require_once __DIR__ . '/../common/analytics-tracker.php';
require_once __DIR__ . '/../common/logger.php';

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$eventType = $data['eventType'] ?? '';
$success = false;

switch ($eventType) {
    case 'pageVisit':
        $page = $data['page'] ?? '';
        $ip = $data['ip'] ?? null;
        $userAgent = $data['userAgent'] ?? null;
        $referrer = $data['referrer'] ?? null;
        $success = trackPageVisit($page, $ip, $userAgent, $referrer);
        break;
        
    case 'signup':
        $userHash = $data['userHash'] ?? '';
        if (!empty($userHash)) {
            $success = trackSignup($userHash);
        }
        break;
        
    case 'roundEvent':
        $roundEventType = $data['roundEventType'] ?? ''; // 'start', 'save', 'abandon'
        $roundType = $data['roundType'] ?? ''; // 'live' or 'registered'
        $userHash = $data['userHash'] ?? null;
        $holesCount = $data['holesCount'] ?? 0;
        $completed = $data['completed'] ?? false;
        if (!empty($roundEventType) && !empty($roundType)) {
            $success = trackRoundEvent($roundEventType, $roundType, $userHash, $holesCount, $completed);
        }
        break;
        
    case 'liveVersionVisit':
        $success = trackLiveVersionVisit();
        break;
        
    default:
        logWarning('Unknown tracking event type', ['eventType' => $eventType]);
        echo json_encode(['success' => false, 'message' => 'Unknown event type']);
        exit;
}

if ($success) {
    echo json_encode(['success' => true]);
} else {
    logError('Failed to track event', ['eventType' => $eventType]);
    echo json_encode(['success' => false, 'message' => 'Failed to track event']);
}
?>

