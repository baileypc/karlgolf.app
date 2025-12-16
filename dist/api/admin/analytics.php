<?php
/**
 * Karl's GIR - Admin Analytics API
 * Returns aggregated analytics data for the admin dashboard
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/analytics-tracker.php';
require_once __DIR__ . '/../common/logger.php';

// Initialize session
initSession();

// Check admin authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Get analytics data
$analyticsFile = getAnalyticsFilePath();
$data = readJsonFile($analyticsFile, getInitialAnalyticsData());

// Get date range filter (optional)
$startDate = $_GET['startDate'] ?? null;
$endDate = $_GET['endDate'] ?? null;

/**
 * Filter data by date range
 */
function filterByDateRange($items, $startDate, $endDate) {
    if (!$startDate && !$endDate) {
        return $items;
    }
    
    return array_filter($items, function($item) use ($startDate, $endDate) {
        $timestamp = $item['timestamp'] ?? '';
        if (empty($timestamp)) {
            return false;
        }
        
        $itemDate = date('Y-m-d', strtotime($timestamp));
        
        if ($startDate && $itemDate < $startDate) {
            return false;
        }
        
        if ($endDate && $itemDate > $endDate) {
            return false;
        }
        
        return true;
    });
}

// Filter data by date range if provided
$pageVisits = filterByDateRange($data['pageVisits'] ?? [], $startDate, $endDate);
$signups = filterByDateRange($data['signups'] ?? [], $startDate, $endDate);
$roundEvents = filterByDateRange($data['roundEvents'] ?? [], $startDate, $endDate);

// Aggregate page visits by page
$pageVisitCounts = [];
foreach ($pageVisits as $visit) {
    $page = $visit['page'] ?? 'unknown';
    $pageVisitCounts[$page] = ($pageVisitCounts[$page] ?? 0) + 1;
}

// Aggregate signups by date
$signupsByDate = [];
foreach ($signups as $signup) {
    $date = date('Y-m-d', strtotime($signup['timestamp'] ?? 'now'));
    $signupsByDate[$date] = ($signupsByDate[$date] ?? 0) + 1;
}

// Calculate round completion metrics
$roundStats = [
    'totalStarts' => 0,
    'totalSaves' => 0,
    'totalAbandons' => 0,
    'liveStarts' => 0,
    'liveSaves' => 0,
    'liveAbandons' => 0,
    'registeredStarts' => 0,
    'registeredSaves' => 0,
    'registeredAbandons' => 0,
    'averageHolesBeforeAbandon' => 0,
    'completionRate' => 0
];

$abandonedHoles = [];
foreach ($roundEvents as $event) {
    $eventType = $event['eventType'] ?? '';
    $roundType = $event['roundType'] ?? '';
    
    if ($eventType === 'start') {
        $roundStats['totalStarts']++;
        if ($roundType === 'live') {
            $roundStats['liveStarts']++;
        } elseif ($roundType === 'registered') {
            $roundStats['registeredStarts']++;
        }
    } elseif ($eventType === 'save') {
        $roundStats['totalSaves']++;
        if ($roundType === 'live') {
            $roundStats['liveSaves']++;
        } elseif ($roundType === 'registered') {
            $roundStats['registeredSaves']++;
        }
    } elseif ($eventType === 'abandon') {
        $roundStats['totalAbandons']++;
        $holesCount = $event['holesCount'] ?? 0;
        if ($holesCount > 0) {
            $abandonedHoles[] = $holesCount;
        }
        if ($roundType === 'live') {
            $roundStats['liveAbandons']++;
        } elseif ($roundType === 'registered') {
            $roundStats['registeredAbandons']++;
        }
    }
}

// Calculate average holes before abandon
if (count($abandonedHoles) > 0) {
    $roundStats['averageHolesBeforeAbandon'] = round(array_sum($abandonedHoles) / count($abandonedHoles), 1);
}

// Calculate completion rate
$totalRounds = $roundStats['totalStarts'];
if ($totalRounds > 0) {
    $roundStats['completionRate'] = round(($roundStats['totalSaves'] / $totalRounds) * 100, 1);
}

// Get recent signups (last 50)
$recentSignups = array_slice(array_reverse($signups), 0, 50);

// Get recent round events (last 100)
$recentRoundEvents = array_slice(array_reverse($roundEvents), 0, 100);

// Prepare response
$response = [
    'success' => true,
    'summary' => [
        'totalPageVisits' => count($pageVisits),
        'totalSignups' => count($signups),
        'totalRoundEvents' => count($roundEvents),
        'liveVersionUsage' => $data['liveVersionUsage'] ?? []
    ],
    'pageVisitCounts' => $pageVisitCounts,
    'signupsByDate' => $signupsByDate,
    'roundStats' => $roundStats,
    'recentSignups' => $recentSignups,
    'recentRoundEvents' => $recentRoundEvents,
    'dateRange' => [
        'startDate' => $startDate,
        'endDate' => $endDate
    ]
];

echo json_encode($response);
?>

