<?php
/**
 * Karl's GIR - Analytics Tracking Helper
 * Centralized functions for tracking user behavior and analytics
 */

require_once __DIR__ . '/file-lock.php';

/**
 * Get analytics data file path
 */
function getAnalyticsFilePath() {
    $dataDir = __DIR__ . '/../../data/admin';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    return $dataDir . '/analytics.json';
}

/**
 * Initialize analytics data structure
 */
function getInitialAnalyticsData() {
    return [
        'pageVisits' => [],
        'signups' => [],
        'roundEvents' => [],
        'liveVersionUsage' => [
            'totalVisits' => 0,
            'roundsStarted' => 0,
            'roundsCompleted' => 0,
            'roundsAbandoned' => 0
        ]
    ];
}

/**
 * Hash IP address for privacy
 */
function hashIP($ip) {
    if (empty($ip)) {
        return 'unknown';
    }
    return hash('sha256', $ip . 'karls_gir_salt_2025');
}

/**
 * Track a page visit
 */
function trackPageVisit($page, $ip = null, $userAgent = null, $referrer = null) {
    $ip = $ip ?? ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $userAgent = $userAgent ?? ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
    $referrer = $referrer ?? ($_SERVER['HTTP_REFERER'] ?? '');
    
    $analyticsFile = getAnalyticsFilePath();
    $data = readJsonFile($analyticsFile, getInitialAnalyticsData());
    
    $visit = [
        'timestamp' => date('Y-m-d H:i:s'),
        'page' => $page,
        'ipHash' => hashIP($ip),
        'userAgent' => substr($userAgent, 0, 200), // Limit length
        'referrer' => substr($referrer, 0, 500) // Limit length
    ];
    
    $data['pageVisits'][] = $visit;
    
    // Keep only last 10,000 visits to prevent file from growing too large
    if (count($data['pageVisits']) > 10000) {
        $data['pageVisits'] = array_slice($data['pageVisits'], -10000);
    }
    
    return writeJsonFile($analyticsFile, $data);
}

/**
 * Track a user signup
 */
function trackSignup($userHash) {
    $analyticsFile = getAnalyticsFilePath();
    $data = readJsonFile($analyticsFile, getInitialAnalyticsData());
    
    $signup = [
        'timestamp' => date('Y-m-d H:i:s'),
        'userHash' => $userHash
    ];
    
    $data['signups'][] = $signup;
    
    return writeJsonFile($analyticsFile, $data);
}

/**
 * Track a round event (start, save, abandon)
 */
function trackRoundEvent($eventType, $roundType, $userHash = null, $holesCount = 0, $completed = false) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    $analyticsFile = getAnalyticsFilePath();
    $data = readJsonFile($analyticsFile, getInitialAnalyticsData());
    
    $event = [
        'timestamp' => date('Y-m-d H:i:s'),
        'eventType' => $eventType, // 'start', 'save', 'abandon'
        'roundType' => $roundType, // 'live' or 'registered'
        'userHash' => $userHash ?? hashIP($ip), // Use IP hash if no user
        'holesCount' => $holesCount,
        'completed' => $completed
    ];
    
    $data['roundEvents'][] = $event;
    
    // Update live version usage stats if it's a live round
    if ($roundType === 'live') {
        if ($eventType === 'start') {
            $data['liveVersionUsage']['roundsStarted']++;
        } elseif ($eventType === 'save' && $completed) {
            $data['liveVersionUsage']['roundsCompleted']++;
        } elseif ($eventType === 'abandon') {
            $data['liveVersionUsage']['roundsAbandoned']++;
        }
    }
    
    // Keep only last 5,000 round events
    if (count($data['roundEvents']) > 5000) {
        $data['roundEvents'] = array_slice($data['roundEvents'], -5000);
    }
    
    return writeJsonFile($analyticsFile, $data);
}

/**
 * Track live version page visit
 */
function trackLiveVersionVisit() {
    $analyticsFile = getAnalyticsFilePath();
    $data = readJsonFile($analyticsFile, getInitialAnalyticsData());
    
    $data['liveVersionUsage']['totalVisits']++;
    
    return writeJsonFile($analyticsFile, $data);
}

