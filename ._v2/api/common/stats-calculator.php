<?php
/**
 * Karl's GIR - Statistics Calculator
 * Centralized statistics calculation to eliminate duplication
 * This is the single source of truth for all stats calculations
 */

/**
 * Calculate statistics for a set of holes
 * @param array $holes Array of hole data
 * @return array Statistics array or null if no valid holes
 */
function calculateStats($holes) {
    // Filter out invalid holes (must have holeNumber and score)
    $validHoles = [];
    foreach ($holes as $h) {
        if (isset($h['holeNumber']) && $h['holeNumber'] > 0 && 
            isset($h['score']) && $h['score'] > 0) {
            $validHoles[] = $h;
        }
    }
    
    if (empty($validHoles)) {
        return null;
    }
    
    $totalHoles = count($validHoles);
    
    // Initialize counters
    $totalPar = 0;
    $totalScore = 0;
    $totalPutts = 0;
    $girsHit = 0;
    $fairwaysHit = 0;
    $eligibleFairways = 0;
    $scrambles = 0;
    $missedGirs = 0;
    $penalties = 0;
    $totalPenaltyStrokes = 0;
    $puttsOnGIR = 0;
    $girHolesCount = 0;
    $allApproachesSum = 0;
    $allApproachesCount = 0;
    $girApproachesSum = 0;
    $girApproachesCount = 0;
    $missedGirApproachesSum = 0;
    $missedGirApproachesCount = 0;
    
    // Process each hole
    foreach ($validHoles as $h) {
        // Par and Score (required)
        $par = isset($h['par']) ? (int)$h['par'] : 0;
        $score = isset($h['score']) ? (int)$h['score'] : 0;
        $totalPar += $par;
        $totalScore += $score;
        
        // Putts
        $putts = isset($h['putts']) ? (int)$h['putts'] : 0;
        $totalPutts += $putts;
        
        // GIR stats
        if (!empty($h['gir'])) {
            $girsHit++;
            $girHolesCount++;
            $puttsOnGIR += $putts;
        } else {
            $missedGirs++;
            // Scrambling: missed GIR but still made par or better
            if ($score > 0 && $par > 0 && $score <= $par) {
                $scrambles++;
            }
        }
        
        // Fairway stats (only for par 4 and par 5)
        if ($par != 3) {
            $eligibleFairways++;
            if (!empty($h['fairway'])) {
                $fairwaysHit++;
            }
        }
        
        // Penalties
        if (isset($h['penalty']) && !empty($h['penalty'])) {
            $penalties++;
            $totalPenaltyStrokes += ($h['penalty'] === 'wrong') ? 2 : 1;
        }
        
        // Approach proximity
        if (isset($h['approachDistance']) && $h['approachDistance'] > 0) {
            $distance = (float)$h['approachDistance'];
            $allApproachesSum += $distance;
            $allApproachesCount++;
            
            if (!empty($h['gir'])) {
                $girApproachesSum += $distance;
                $girApproachesCount++;
            } else {
                $missedGirApproachesSum += $distance;
                $missedGirApproachesCount++;
            }
        }
    }
    
    // Calculate percentages and averages
    $avgScore = $totalHoles > 0 ? round($totalScore / $totalHoles, 2) : 0;
    $toPar = $totalScore - $totalPar;
    $girPct = $totalHoles > 0 ? round(($girsHit / $totalHoles) * 100, 1) : 0;
    $fairwayPct = $eligibleFairways > 0 ? round(($fairwaysHit / $eligibleFairways) * 100, 1) : 0;
    $puttsPerGIR = $girHolesCount > 0 ? round($puttsOnGIR / $girHolesCount, 2) : 0;
    $scramblingPct = $missedGirs > 0 ? round(($scrambles / $missedGirs) * 100, 1) : 0;
    $avgPutts = $totalHoles > 0 ? round($totalPutts / $totalHoles, 2) : 0;
    $avgProximity = $allApproachesCount > 0 ? round($allApproachesSum / $allApproachesCount, 1) : 0;
    $avgProximityGIR = $girApproachesCount > 0 ? round($girApproachesSum / $girApproachesCount, 1) : 0;
    $avgProximityMissed = $missedGirApproachesCount > 0 ? round($missedGirApproachesSum / $missedGirApproachesCount, 1) : 0;
    
    return [
        'totalHoles' => $totalHoles,
        'totalScore' => $totalScore,
        'totalPar' => $totalPar,
        'toPar' => $toPar,
        'avgScore' => $avgScore,
        'girsHit' => $girsHit,
        'girPct' => $girPct,
        'fairwaysHit' => $fairwaysHit,
        'eligibleFairways' => $eligibleFairways,
        'fairwayPct' => $fairwayPct,
        'totalPutts' => $totalPutts,
        'avgPutts' => $avgPutts,
        'puttsPerGIR' => $puttsPerGIR,
        'scrambles' => $scrambles,
        'missedGirs' => $missedGirs,
        'scramblingPct' => $scramblingPct,
        'penalties' => $penalties,
        'totalPenaltyStrokes' => $totalPenaltyStrokes,
        'avgProximity' => $avgProximity,
        'avgProximityGIR' => $avgProximityGIR,
        'avgProximityMissed' => $avgProximityMissed
    ];
}

/**
 * Calculate statistics for multiple rounds
 * @param array $rounds Array of round data (each with 'holes' array)
 * @return array Statistics array or null if no valid holes
 */
function calculateStatsForRounds($rounds) {
    if (empty($rounds)) {
        return null;
    }
    
    // Collect all holes from all rounds
    $allHoles = [];
    foreach ($rounds as $round) {
        if (isset($round['holes']) && is_array($round['holes'])) {
            foreach ($round['holes'] as $hole) {
                if (isset($hole['holeNumber']) && $hole['holeNumber'] > 0 && 
                    isset($hole['score']) && $hole['score'] > 0) {
                    $allHoles[] = $hole;
                }
            }
        }
    }
    
    if (empty($allHoles)) {
        return null;
    }
    
    $stats = calculateStats($allHoles);
    if ($stats) {
        $stats['rounds'] = count($rounds);
    }
    
    return $stats;
}

