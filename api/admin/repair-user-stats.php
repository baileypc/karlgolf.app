<?php
/**
 * Karl's GIR - Admin: Repair User Stats
 * Recalculates stats for a specific user's rounds using the fixed
 * stats-calculator (strict gir === 'y' check).
 *
 * Usage (browser):
 *   /api/admin/repair-user-stats.php?pass=<admin_password>&email=someone@example.com
 */

require_once __DIR__ . '/../common/data-path.php';
require_once __DIR__ . '/../common/stats-calculator.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/logger.php';

header('Content-Type: text/plain; charset=utf-8');

// ─── Auth: verify against stored admin credentials ────────────────────────────
$providedPass = $_GET['pass'] ?? '';
if (empty($providedPass)) {
    http_response_code(403);
    die("Missing ?pass= parameter\n");
}

$dataDir        = getDataDirectory();
$credFile       = $dataDir . '/admin/admin_credentials.json';
$adminCreds     = file_exists($credFile) ? json_decode(file_get_contents($credFile), true) : null;

if (!$adminCreds || !password_verify($providedPass, $adminCreds['passwordHash'])) {
    http_response_code(403);
    die("Invalid password\n");
}

// ─── Resolve email ────────────────────────────────────────────────────────────
$email = trim($_GET['email'] ?? '');
if (!$email) {
    die("Usage: repair-user-stats.php?pass=xxx&email=someone@example.com\n");
}

$userHash   = hash('sha256', strtolower($email));
$userDir    = $dataDir . '/' . $userHash;
$roundsFile = $userDir . '/rounds.json';

echo "Repairing stats for: $email\n";
echo "User hash: $userHash\n\n";

if (!is_dir($userDir)) {
    die("No data directory found for this user.\n");
}
if (!file_exists($roundsFile)) {
    die("No rounds.json found for this user.\n");
}

// ─── Load & repair ────────────────────────────────────────────────────────────
$rounds = readJsonFile($roundsFile, []);
if (empty($rounds)) {
    die("No rounds found.\n");
}

$repaired = 0;
foreach ($rounds as $idx => &$round) {
    $holes = $round['holes'] ?? [];
    if (empty($holes)) continue;

    $oldStats = $round['stats'] ?? [];
    $newStats = calculateStats($holes);
    if (!$newStats) continue;

    $roundNum = $round['roundNumber'] ?? ($idx + 1);
    $course   = $round['courseName'] ?? 'Unknown';
    echo "Round $roundNum — $course ({$round['date']} | " . count($holes) . " holes)\n";
    echo "  girsHit:    " . ($oldStats['girsHit'] ?? '?') . "  ->  {$newStats['girsHit']}\n";
    echo "  missedGirs: " . ($oldStats['missedGirs'] ?? '?') . "  ->  {$newStats['missedGirs']}\n";
    echo "  girPct:     " . ($oldStats['girPct'] ?? '?') . "%  ->  {$newStats['girPct']}%\n";
    echo "  toPar:      " . ($oldStats['toPar'] ?? '?') . "  ->  {$newStats['toPar']}\n\n";

    $round['stats'] = $newStats;
    $repaired++;
}
unset($round);

// ─── Save ─────────────────────────────────────────────────────────────────────
if ($repaired === 0) {
    die("No rounds needed repair.\n");
}

if (writeJsonFile($roundsFile, $rounds)) {
    logInfo('Admin repaired user stats', ['email' => $email, 'roundsRepaired' => $repaired]);
    echo "Done - repaired $repaired round(s) for $email\n";
} else {
    die("Failed to write rounds.json\n");
}
