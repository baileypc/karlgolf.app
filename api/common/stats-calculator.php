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
    
    // Tiger Five counters
    $doubleBogeys = 0;
    $par5Bogeys = 0;
    $threePutts = 0;
    $bogeyFromInside150 = 0;
    $blownSaves = 0;
    
    // Scoring by par type
    $par3Score = 0; $par3Count = 0;
    $par4Score = 0; $par4Count = 0;
    $par5Score = 0; $par5Count = 0;
    
    // Score distribution
    $eagles = 0; $birdies = 0; $pars = 0;
    $bogeys = 0; $doubleBogeysDist = 0; $triplePlus = 0;
    
    // GIR by approach lie
    $girFromFairway = 0; $approachFromFairway = 0;
    $girFromRough = 0; $approachFromRough = 0;
    $girFromSand = 0; $approachFromSand = 0;
    
    // Putt distance buckets (1-putt % by first putt distance)
    $puttBuckets = [
        'under5' => ['onePutts' => 0, 'total' => 0],
        '5to15' => ['onePutts' => 0, 'total' => 0],
        '15to30' => ['onePutts' => 0, 'total' => 0],
        'over30' => ['onePutts' => 0, 'total' => 0],
    ];
    $firstPuttDistSum = 0;
    $firstPuttDistCount = 0;
    $firstPuttDistGirSum = 0;
    $firstPuttDistGirCount = 0;
    $firstPuttDistMissedSum = 0;
    $firstPuttDistMissedCount = 0;
    
    // Approach categories tracking
    $approachCategories = [
        '0-50' => ['range' => '0-50', 'attempts' => 0, 'hits' => 0, 'girPct' => '0.0'],
        '50-100' => ['range' => '50-100', 'attempts' => 0, 'hits' => 0, 'girPct' => '0.0'],
        '100-150' => ['range' => '100-150', 'attempts' => 0, 'hits' => 0, 'girPct' => '0.0'],
        '150+' => ['range' => '150+', 'attempts' => 0, 'hits' => 0, 'girPct' => '0.0']
    ];
    
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
        
        // GIR stats — must be strict === 'y' check; !empty() returns true for 'n' too
        if (($h['gir'] ?? '') === 'y') {
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
            if (isset($h['fairway']) && $h['fairway'] === 'y') {
                $fairwaysHit++;
            }
        }
        
        // Penalties
        if (isset($h['penalty']) && !empty($h['penalty'])) {
            $penalties++;
            $totalPenaltyStrokes += ($h['penalty'] === 'wrong') ? 2 : 1;
        }
        
        // Tiger Five calculations
        $diff = $score - $par;
        if ($diff >= 2) $doubleBogeys++;
        if ($par == 5 && $diff >= 1) $par5Bogeys++;
        if ($putts >= 3) $threePutts++;
        if (isset($h['proximity']) && $h['proximity'] > 0 && $h['proximity'] <= 150 && $diff >= 1) {
            $bogeyFromInside150++;
        }
        if (($h['gir'] ?? '') !== 'y' && $diff >= 2) {
            $blownSaves++;
        }
        
        // Scoring by par type
        if ($par == 3) { $par3Score += $score; $par3Count++; }
        elseif ($par == 4) { $par4Score += $score; $par4Count++; }
        elseif ($par == 5) { $par5Score += $score; $par5Count++; }
        
        // Score distribution
        if ($diff <= -2) $eagles++;
        elseif ($diff == -1) $birdies++;
        elseif ($diff == 0) $pars++;
        elseif ($diff == 1) $bogeys++;
        elseif ($diff == 2) $doubleBogeysDist++;
        else $triplePlus++;
        
        // GIR by approach lie
        $approachLie = $h['approachLie'] ?? null;
        if ($approachLie) {
            $isGir = (($h['gir'] ?? '') === 'y');
            if ($approachLie === 'fairway') {
                $approachFromFairway++;
                if ($isGir) $girFromFairway++;
            } elseif ($approachLie === 'rough') {
                $approachFromRough++;
                if ($isGir) $girFromRough++;
            } elseif ($approachLie === 'sand') {
                $approachFromSand++;
                if ($isGir) $girFromSand++;
            }
        }
        
        // Putt distance bucket tracking
        if (isset($h['puttDistances']) && is_array($h['puttDistances']) && count($h['puttDistances']) > 0) {
            $firstPutt = (float)$h['puttDistances'][0];
            if ($firstPutt > 0) {
                $isOnePutt = ($putts === 1);
                $firstPuttDistSum += $firstPutt;
                $firstPuttDistCount++;
                
                if (($h['gir'] ?? '') === 'y') {
                    $firstPuttDistGirSum += $firstPutt;
                    $firstPuttDistGirCount++;
                } else {
                    $firstPuttDistMissedSum += $firstPutt;
                    $firstPuttDistMissedCount++;
                }
                
                if ($firstPutt < 5) {
                    $puttBuckets['under5']['total']++;
                    if ($isOnePutt) $puttBuckets['under5']['onePutts']++;
                } elseif ($firstPutt <= 15) {
                    $puttBuckets['5to15']['total']++;
                    if ($isOnePutt) $puttBuckets['5to15']['onePutts']++;
                } elseif ($firstPutt <= 30) {
                    $puttBuckets['15to30']['total']++;
                    if ($isOnePutt) $puttBuckets['15to30']['onePutts']++;
                } else {
                    $puttBuckets['over30']['total']++;
                    if ($isOnePutt) $puttBuckets['over30']['onePutts']++;
                }
            }
        }
        
        // Approach proximity
        if (isset($h['proximity']) && $h['proximity'] > 0) {
            $distance = (float)$h['proximity'];
            $allApproachesSum += $distance;
            $allApproachesCount++;
            
            if (($h['gir'] ?? '') === 'y') {
                $girApproachesSum += $distance;
                $girApproachesCount++;
                $isHit = true;
            } else {
                $missedGirApproachesSum += $distance;
                $missedGirApproachesCount++;
                $isHit = false;
            }
            
            // Bucket by distance
            if ($distance <= 50) {
                $approachCategories['0-50']['attempts']++;
                if ($isHit) $approachCategories['0-50']['hits']++;
            } else if ($distance <= 100) {
                $approachCategories['50-100']['attempts']++;
                if ($isHit) $approachCategories['50-100']['hits']++;
            } else if ($distance <= 150) {
                $approachCategories['100-150']['attempts']++;
                if ($isHit) $approachCategories['100-150']['hits']++;
            } else {
                $approachCategories['150+']['attempts']++;
                if ($isHit) $approachCategories['150+']['hits']++;
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
    
    // Calculate percentages for approach categories
    foreach ($approachCategories as $key => $cat) {
        if ($cat['attempts'] > 0) {
            $approachCategories[$key]['girPct'] = number_format(($cat['hits'] / $cat['attempts']) * 100, 1);
        }
    }
    
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
        'avgProximityMissed' => $avgProximityMissed,
        'approachCategories' => $approachCategories,
        // Tiger Five
        'tigerFive' => [
            'doubleBogeys' => $doubleBogeys,
            'par5Bogeys' => $par5Bogeys,
            'threePutts' => $threePutts,
            'bogeyFromInside150' => $bogeyFromInside150,
            'blownSaves' => $blownSaves,
        ],
        // Scoring by par type
        'scoringByPar' => [
            'par3' => ['avg' => $par3Count > 0 ? round($par3Score / $par3Count, 2) : 0, 'count' => $par3Count],
            'par4' => ['avg' => $par4Count > 0 ? round($par4Score / $par4Count, 2) : 0, 'count' => $par4Count],
            'par5' => ['avg' => $par5Count > 0 ? round($par5Score / $par5Count, 2) : 0, 'count' => $par5Count],
        ],
        // Score distribution
        'scoreDistribution' => [
            'eagles' => $eagles,
            'birdies' => $birdies,
            'pars' => $pars,
            'bogeys' => $bogeys,
            'doubles' => $doubleBogeysDist,
            'triplePlus' => $triplePlus,
        ],
        // Putt distance buckets
        'puttBuckets' => [
            'under5' => ['onePutts' => $puttBuckets['under5']['onePutts'], 'total' => $puttBuckets['under5']['total'], 'pct' => $puttBuckets['under5']['total'] > 0 ? round(($puttBuckets['under5']['onePutts'] / $puttBuckets['under5']['total']) * 100, 1) : 0],
            '5to15' => ['onePutts' => $puttBuckets['5to15']['onePutts'], 'total' => $puttBuckets['5to15']['total'], 'pct' => $puttBuckets['5to15']['total'] > 0 ? round(($puttBuckets['5to15']['onePutts'] / $puttBuckets['5to15']['total']) * 100, 1) : 0],
            '15to30' => ['onePutts' => $puttBuckets['15to30']['onePutts'], 'total' => $puttBuckets['15to30']['total'], 'pct' => $puttBuckets['15to30']['total'] > 0 ? round(($puttBuckets['15to30']['onePutts'] / $puttBuckets['15to30']['total']) * 100, 1) : 0],
            'over30' => ['onePutts' => $puttBuckets['over30']['onePutts'], 'total' => $puttBuckets['over30']['total'], 'pct' => $puttBuckets['over30']['total'] > 0 ? round(($puttBuckets['over30']['onePutts'] / $puttBuckets['over30']['total']) * 100, 1) : 0],
        ],
        'avgFirstPuttDist' => $firstPuttDistCount > 0 ? round($firstPuttDistSum / $firstPuttDistCount, 1) : 0,
        'avgFirstPuttDistGir' => $firstPuttDistGirCount > 0 ? round($firstPuttDistGirSum / $firstPuttDistGirCount, 1) : 0,
        'avgFirstPuttDistMissed' => $firstPuttDistMissedCount > 0 ? round($firstPuttDistMissedSum / $firstPuttDistMissedCount, 1) : 0,
        // GIR by approach lie
        'girByLie' => [
            'fairway' => ['gir' => $girFromFairway, 'total' => $approachFromFairway, 'pct' => $approachFromFairway > 0 ? round(($girFromFairway / $approachFromFairway) * 100, 1) : 0],
            'rough' => ['gir' => $girFromRough, 'total' => $approachFromRough, 'pct' => $approachFromRough > 0 ? round(($girFromRough / $approachFromRough) * 100, 1) : 0],
            'sand' => ['gir' => $girFromSand, 'total' => $approachFromSand, 'pct' => $approachFromSand > 0 ? round(($girFromSand / $approachFromSand) * 100, 1) : 0],
        ],
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

