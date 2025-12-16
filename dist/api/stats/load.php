<?php
/**
 * Karl's GIR - Load User Stats for Dashboard
 * Returns stats grouped by every 10 rounds plus cumulative averages
 * Uses shared components for session, file locking, and stats calculation
 */

require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/stats-calculator.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/data-path.php';

// Initialize session
initSession();

// Require authentication
$auth = requireAuth();
$userHash = $auth['userHash'];
$dataDir = getDataDirectory();
$roundsFile = $dataDir . '/' . $userHash . '/rounds.json';

// Load rounds with file locking
$roundsData = readJsonFile($roundsFile, []);

if (empty($roundsData) || !is_array($roundsData)) {
    echo json_encode(['success' => true, 'totalRounds' => 0, 'rounds' => [], 'groups' => [], 'cumulative' => null]);
    exit;
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
    $stats = calculateStats($round['holes'] ?? []);
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
$cumulativeStats = calculateStatsForRounds($roundsData);

echo json_encode([
    'success' => true,
    'totalRounds' => $totalRounds,
    'groups' => $groups,
    'cumulative' => $cumulativeStats
]);
?>
