<?php
// Karl's GIR - Email Results Handler
// Compatible with SiteGround shared hosting

header('Content-Type: application/json');

// Allow CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit;
    }

    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $roundType = $data['roundType'] ?? '';
    $holes = $data['holes'] ?? [];
    $stats = $data['stats'] ?? [];

    // Validate input
    if (!$email) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit;
    }

    if (empty($holes)) {
        echo json_encode(['success' => false, 'message' => 'No hole data provided']);
        exit;
    }

    // Build email content
    $roundTitle = $roundType === '9hole' ? 'Front 9 Results' : 'Full Round Results';
    $date = date('F j, Y');
    
    // Email subject
    $subject = "Karl's GIR - {$roundTitle} - {$date}";

    // Build HTML email
    $htmlContent = buildHtmlEmail($roundTitle, $date, $holes, $stats);

    // Build plain text version
    $textContent = buildTextEmail($roundTitle, $date, $holes, $stats);

    // Email headers for HTML
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Karl's GIR <noreply@karlgolf.app>\r\n";
    $headers .= "Reply-To: noreply@karlgolf.app\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Send email using PHP mail() - compatible with SiteGround
    $mailSent = mail($email, $subject, $htmlContent, $headers);

    if ($mailSent) {
        echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send email']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

// Function to build HTML email
function buildHtmlEmail($title, $date, $holes, $stats) {
    $toParDisplay = $stats['toPar'] == 0 ? 'E' : ($stats['toPar'] > 0 ? '+' . $stats['toPar'] : $stats['toPar']);
    $girPct = $stats['totalGirs'] > 0 ? number_format(($stats['girsHit'] / $stats['totalGirs']) * 100, 1) : 0;
    $fairwayPct = $stats['eligibleFairways'] > 0 ? number_format(($stats['fairwaysHit'] / $stats['eligibleFairways']) * 100, 1) : 0;
    $scramblingPct = $stats['missedGirs'] > 0 ? number_format(($stats['scrambles'] / $stats['missedGirs']) * 100, 1) : 0;
    $avgProximity = isset($stats['avgProximity']) ? $stats['avgProximity'] : 'N/A';

    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #16a34a; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .hole-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .hole-table th { background: #16a34a; color: white; padding: 10px; text-align: left; font-size: 14px; }
        .hole-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        .hole-table tr:hover { background: #f9fafb; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin: 0 2px; }
        .badge-gir { background: #dcfce7; color: #166534; }
        .badge-penalty { background: #fee2e2; color: #991b1b; }
        .badge-sand { background: #fef3c7; color: #92400e; }
        .badge-chip { background: #e9d5ff; color: #6b21a8; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⛳ {$title}</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">{$date}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">{$stats['totalScore']}</div>
            <div class="stat-label">Total Score ({$toParDisplay})</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{$stats['girsHit']}/{$stats['totalGirs']}</div>
            <div class="stat-label">GIR ({$girPct}%)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{$stats['fairwaysHit']}/{$stats['eligibleFairways']}</div>
            <div class="stat-label">Fairways ({$fairwayPct}%)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{$stats['puttsPerGIR']}</div>
            <div class="stat-label">Putts per GIR</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{$stats['scrambles']}/{$stats['missedGirs']}</div>
            <div class="stat-label">Scrambling ({$scramblingPct}%)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{$stats['totalPenaltyStrokes']}</div>
            <div class="stat-label">Penalties ({$stats['penalties']} holes)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{$avgProximity}ft</div>
            <div class="stat-label">Avg Proximity</div>
        </div>
    </div>

    <h2 style="color: #16a34a; margin-top: 30px;">Hole-by-Hole Breakdown</h2>
    <table class="hole-table">
        <thead>
            <tr>
                <th>Hole</th>
                <th>Par</th>
                <th>Score</th>
                <th>Putts</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
HTML;

    // Add each hole row
    foreach ($holes as $hole) {
        $holeNum = $hole['holeNumber'];
        $par = $hole['par'];
        $score = $hole['score'];
        $putts = $hole['putts'];
        $toPar = $score - $par;
        $toParStr = $toPar == 0 ? 'E' : ($toPar > 0 ? '+' . $toPar : $toPar);
        
        $badges = '';
        if ($hole['gir']) $badges .= '<span class="badge badge-gir">✓ GIR</span>';
        if ($hole['penalty']) $badges .= '<span class="badge badge-penalty">⚠ Penalty</span>';
        // Auto-calculate scrambling: par or better when GIR missed
        if (!$hole['gir'] && $score <= $par) $badges .= '<span class="badge badge-chip">⭐ Scrambled</span>';
        
        $html .= <<<ROW
            <tr>
                <td><strong>#{$holeNum}</strong></td>
                <td>{$par}</td>
                <td><strong>{$score}</strong> ({$toParStr})</td>
                <td>{$putts}</td>
                <td>{$badges}</td>
            </tr>
ROW;
    }

    $html .= <<<HTML
        </tbody>
    </table>

    <div class="footer">
        <p><strong>Karl's GIR</strong> - Golf Performance Tracker</p>
        <p>Track your game. Improve your score. 🏌️‍♂️</p>
    </div>
</body>
</html>
HTML;

    return $html;
}

// Function to build plain text email (fallback)
function buildTextEmail($title, $date, $holes, $stats) {
    $toParDisplay = $stats['toPar'] == 0 ? 'E' : ($stats['toPar'] > 0 ? '+' . $stats['toPar'] : $stats['toPar']);
    $girPct = $stats['totalGirs'] > 0 ? number_format(($stats['girsHit'] / $stats['totalGirs']) * 100, 1) : 0;
    $fairwayPct = $stats['eligibleFairways'] > 0 ? number_format(($stats['fairwaysHit'] / $stats['eligibleFairways']) * 100, 1) : 0;
    
    $text = "===========================================\n";
    $text .= "KARL'S GIR - {$title}\n";
    $text .= "{$date}\n";
    $text .= "===========================================\n\n";
    
    $scramblingPct = $stats['missedGirs'] > 0 ? number_format(($stats['scrambles'] / $stats['missedGirs']) * 100, 1) : 0;
    $puttsPerGIR = isset($stats['puttsPerGIR']) ? $stats['puttsPerGIR'] : '0.00';
    
    $text .= "ROUND SUMMARY - 6 ESSENTIAL METRICS\n";
    $text .= "------------------------------------\n";
    $text .= "1. Scoring Average: {$stats['totalScore']} ({$toParDisplay})\n";
    $text .= "2. GIR: {$stats['girsHit']}/{$stats['totalGirs']} ({$girPct}%)\n";
    $text .= "3. Fairways: {$stats['fairwaysHit']}/{$stats['eligibleFairways']} ({$fairwayPct}%)\n";
    $text .= "4. Putts per GIR: {$puttsPerGIR}\n";
    $text .= "5. Scrambling: {$stats['scrambles']}/{$stats['missedGirs']} ({$scramblingPct}%)\n";
    $text .= "6. Penalties: {$stats['totalPenaltyStrokes']} stroke(s) ({$stats['penalties']} hole(s))\n";
    $text .= "\nAdditional: Avg Proximity: {$stats['avgProximity']}ft\n";
    $text .= "Total Putts: {$stats['totalPutts']} ({$stats['avgPutts']} avg)\n\n";
    
    $text .= "HOLE-BY-HOLE\n";
    $text .= "-------------\n";
    
    foreach ($holes as $hole) {
        $holeNum = $hole['holeNumber'];
        $par = $hole['par'];
        $score = $hole['score'];
        $toPar = $score - $par;
        $toParStr = $toPar == 0 ? 'E' : ($toPar > 0 ? '+' . $toPar : $toPar);
        
        $text .= "Hole #{$holeNum}: Par {$par}, Score {$score} ({$toParStr})";
        if ($hole['gir']) $text .= " [GIR]";
        if ($hole['penalty']) $text .= " [PENALTY]";
        // Auto-calculate scrambling
        if (!$hole['gir'] && $score <= $par) $text .= " [SCRAMBLED]";
        $text .= "\n";
    }
    
    $text .= "\n===========================================\n";
    $text .= "Karl's GIR - Golf Performance Tracker\n";
    $text .= "===========================================\n";
    
    return $text;
}
?>
