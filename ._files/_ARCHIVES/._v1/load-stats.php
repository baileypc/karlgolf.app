<?php
// Karl's GIR - Load User Stats for Dashboard
// Returns stats grouped by every 10 rounds plus cumulative averages

// Configure session cookie before starting session (same as auth.php)
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_lifetime', '0');

// Detect if we're on HTTPS
$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
            (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $isSecure,
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_email']) || !isset($_SESSION['user_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$userHash = $_SESSION['user_hash'];
$roundsFile = __DIR__ . '/data/' . $userHash . '/rounds.json';

if (!file_exists($roundsFile)) {
    echo json_encode(['success' => true, 'totalRounds' => 0, 'rounds' => [], 'groups' => [], 'cumulative' => null]);
    exit;
}

$roundsData = json_decode(file_get_contents($roundsFile), true);
if (!$roundsData || !is_array($roundsData)) {
    echo json_encode(['success' => true, 'totalRounds' => 0, 'rounds' => [], 'groups' => [], 'cumulative' => null]);
    exit;
}

// Calculate stats for a set of rounds
function calculateStats($rounds) {
    if (empty($rounds)) {
        return null;
    }

    $allHoles = [];
    foreach ($rounds as $round) {
        if (isset($round['holes']) && is_array($round['holes'])) {
            $allHoles = array_merge($allHoles, $round['holes']);
        }
    }

    if (empty($allHoles)) {
        return null;
    }

    $totalHoles = count($allHoles);
    $totalPar = array_sum(array_column($allHoles, 'par'));
    $totalScore = array_sum(array_column($allHoles, 'score'));
    $avgScore = $totalHoles > 0 ? round($totalScore / $totalHoles, 2) : 0;
    $toPar = $totalScore - $totalPar;

    // GIR stats
    $girsHit = count(array_filter($allHoles, function($h) { return !empty($h['gir']); }));
    $girPct = $totalHoles > 0 ? round(($girsHit / $totalHoles) * 100, 1) : 0;

    // Fairway stats
    $eligibleFairways = array_filter($allHoles, function($h) { return isset($h['par']) && $h['par'] != 3; });
    $fairwaysHit = count(array_filter($eligibleFairways, function($h) { return !empty($h['fairway']); }));
    $fairwayPct = count($eligibleFairways) > 0 ? round(($fairwaysHit / count($eligibleFairways)) * 100, 1) : 0;

    // Putts per GIR
    $girHoles = array_filter($allHoles, function($h) { return !empty($h['gir']); });
    $puttsOnGIR = array_sum(array_column($girHoles, 'putts'));
    $puttsPerGIR = count($girHoles) > 0 ? round($puttsOnGIR / count($girHoles), 2) : 0;

    // Scrambling
    $missedGirs = array_filter($allHoles, function($h) { return empty($h['gir']); });
    $scrambles = count(array_filter($missedGirs, function($h) { 
        return isset($h['score']) && isset($h['par']) && $h['score'] <= $h['par']; 
    }));
    $scramblingPct = count($missedGirs) > 0 ? round(($scrambles / count($missedGirs)) * 100, 1) : 0;

    // Penalties
    $penalties = count(array_filter($allHoles, function($h) { 
        return isset($h['penalty']) && !empty($h['penalty']); 
    }));
    $totalPenaltyStrokes = array_sum(array_map(function($h) {
        if (!isset($h['penalty']) || empty($h['penalty'])) return 0;
        return ($h['penalty'] === 'wrong') ? 2 : 1;
    }, $allHoles));

    // Approach proximity
    $allApproaches = array_filter($allHoles, function($h) { return isset($h['approachDistance']) && $h['approachDistance'] > 0; });
    $avgProximity = count($allApproaches) > 0 
        ? round(array_sum(array_column($allApproaches, 'approachDistance')) / count($allApproaches), 1)
        : 0;

    $girApproaches = array_filter($allHoles, function($h) { 
        return !empty($h['gir']) && isset($h['approachDistance']) && $h['approachDistance'] > 0; 
    });
    $avgProximityGIR = count($girApproaches) > 0
        ? round(array_sum(array_column($girApproaches, 'approachDistance')) / count($girApproaches), 1)
        : 0;

    $missedGirApproaches = array_filter($allHoles, function($h) { 
        return empty($h['gir']) && isset($h['approachDistance']) && $h['approachDistance'] > 0; 
    });
    $avgProximityMissed = count($missedGirApproaches) > 0
        ? round(array_sum(array_column($missedGirApproaches, 'approachDistance')) / count($missedGirApproaches), 1)
        : 0;

    return [
        'rounds' => count($rounds),
        'totalHoles' => $totalHoles,
        'avgScore' => $avgScore,
        'totalScore' => $totalScore,
        'totalPar' => $totalPar,
        'toPar' => $toPar,
        'girsHit' => $girsHit,
        'girPct' => $girPct,
        'fairwaysHit' => $fairwaysHit,
        'eligibleFairways' => count($eligibleFairways),
        'fairwayPct' => $fairwayPct,
        'puttsPerGIR' => $puttsPerGIR,
        'scrambles' => $scrambles,
        'missedGirs' => count($missedGirs),
        'scramblingPct' => $scramblingPct,
        'penalties' => $penalties,
        'totalPenaltyStrokes' => $totalPenaltyStrokes,
        'avgProximity' => $avgProximity,
        'avgProximityGIR' => $avgProximityGIR,
        'avgProximityMissed' => $avgProximityMissed
    ];
}

// Group rounds individually (one round per card)
$groups = [];
$totalRounds = count($roundsData);

// Reverse the rounds array so newest appears first
$reversedRounds = array_reverse($roundsData);

for ($i = 0; $i < $totalRounds; $i++) {
    $round = $reversedRounds[$i];
    $roundNumber = $round['roundNumber'] ?? ($totalRounds - $i);
    
    // Calculate stats for this single round
    $stats = calculateStats([$round]);
    if ($stats) {
        $courseName = $round['courseName'] ?? 'Unnamed Course';
        $date = $round['date'] ?? '';
        $courseNameStr = $date ? $courseName . ' (' . $date . ')' : $courseName;
        
        $groups[] = [
            'roundNumber' => $roundNumber,
            'range' => 'Round ' . $roundNumber,
            'startRound' => $roundNumber,
            'endRound' => $roundNumber,
            'stats' => $stats,
            'courseName' => $courseNameStr,
            'rounds' => [$round], // Single round for export
            'isNewest' => $i === 0 // Mark the first (newest) round
        ];
    }
}

// Calculate cumulative stats (all rounds)
$cumulativeStats = calculateStats($roundsData);

echo json_encode([
    'success' => true,
    'totalRounds' => $totalRounds,
    'groups' => $groups,
    'cumulative' => $cumulativeStats
]);
?>

