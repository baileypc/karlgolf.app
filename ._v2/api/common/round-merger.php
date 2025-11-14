<?php
/**
 * Karl's GIR - Round Merger
 * Handles merging holes into existing rounds
 * This eliminates the complex nested logic from save.php
 */

require_once __DIR__ . '/stats-calculator.php';

/**
 * Merge new holes into existing holes array
 * Handles both adding new holes and updating existing ones
 * @param array $existingHoles Current holes array
 * @param array $newHoles New holes to merge in
 * @return array ['holes' => array, 'added' => int, 'updated' => int]
 */
function mergeHoles($existingHoles, $newHoles) {
    // Create a map of existing holes by hole number for quick lookup
    $existingHolesMap = [];
    foreach ($existingHoles as $idx => $hole) {
        $holeNum = $hole['holeNumber'] ?? 0;
        if ($holeNum > 0) {
            $existingHolesMap[$holeNum] = $idx;
        }
    }
    
    $holesAdded = 0;
    $holesUpdated = 0;
    
    // Process new holes: add new ones or update existing ones
    foreach ($newHoles as $hole) {
        $holeNum = $hole['holeNumber'] ?? 0;
        
        if ($holeNum > 0) {
            if (isset($existingHolesMap[$holeNum])) {
                // Hole with this number already exists - update it
                $existingHoles[$existingHolesMap[$holeNum]] = $hole;
                $holesUpdated++;
            } else {
                // New hole number - add it
                $existingHoles[] = $hole;
                $existingHolesMap[$holeNum] = count($existingHoles) - 1;
                $holesAdded++;
            }
        }
    }
    
    // Sort holes by hole number to maintain order
    usort($existingHoles, function($a, $b) {
        $numA = $a['holeNumber'] ?? 0;
        $numB = $b['holeNumber'] ?? 0;
        return $numA <=> $numB;
    });
    
    return [
        'holes' => $existingHoles,
        'added' => $holesAdded,
        'updated' => $holesUpdated
    ];
}

/**
 * Merge round data into existing round
 * @param array $existingRound Existing round data
 * @param array $newRoundData New round data to merge
 * @return array ['success' => bool, 'round' => array, 'added' => int, 'updated' => int, 'error' => string]
 */
function mergeRound($existingRound, $newRoundData) {
    $existingHoles = $existingRound['holes'] ?? [];
    $newHoles = $newRoundData['holes'] ?? [];
    
    // Check if round is complete (18 holes)
    if (count($existingHoles) >= 18) {
        return [
            'success' => false,
            'round' => null,
            'added' => 0,
            'updated' => 0,
            'error' => 'Cannot add to a round that already has 18 holes'
        ];
    }
    
    // Merge holes
    $mergeResult = mergeHoles($existingHoles, $newHoles);
    
    // Log merge details for debugging
    error_log("Merge details - Existing holes: " . count($existingHoles) . ", New holes: " . count($newHoles) . ", Added: " . $mergeResult['added'] . ", Updated: " . $mergeResult['updated'] . ", Final: " . count($mergeResult['holes']));
    
    // If no holes were added or updated, this is a duplicate save attempt
    if ($mergeResult['added'] === 0 && $mergeResult['updated'] === 0) {
        return [
            'success' => false,
            'round' => null,
            'added' => 0,
            'updated' => 0,
            'error' => 'No new holes to add. All holes have already been saved.'
        ];
    }
    
    // Update round with merged holes
    $existingRound['holes'] = $mergeResult['holes'];
    $existingRound['timestamp'] = date('Y-m-d H:i:s');
    $existingRound['lastUpdated'] = date('Y-m-d H:i:s');
    
    // Recalculate stats for merged round
    $stats = calculateStats($mergeResult['holes']);
    if ($stats) {
        $existingRound['stats'] = $stats;
    }
    
    // Find the highest hole number
    $maxHoleNumber = 0;
    foreach ($mergeResult['holes'] as $hole) {
        $holeNum = $hole['holeNumber'] ?? 0;
        if ($holeNum > $maxHoleNumber) {
            $maxHoleNumber = $holeNum;
        }
    }
    
    return [
        'success' => true,
        'round' => $existingRound,
        'added' => $mergeResult['added'],
        'updated' => $mergeResult['updated'],
        'maxHoleNumber' => $maxHoleNumber,
        'error' => null
    ];
}

/**
 * Find incomplete round matching course name
 * @param array $rounds All rounds array
 * @param string $courseName Course name to match
 * @return int|null Index of matching round or null
 */
function findIncompleteRoundByCourse($rounds, $courseName) {
    $normalizedCourseName = trim($courseName);
    
    foreach ($rounds as $idx => $round) {
        $existingHoleCount = count($round['holes'] ?? []);
        $existingCourseName = trim($round['courseName'] ?? '');
        
        // Match incomplete rounds with same course name
        if ($existingHoleCount < 18 && $existingCourseName === $normalizedCourseName) {
            return $idx;
        }
    }
    
    return null;
}

