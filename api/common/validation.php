<?php
/**
 * Karl's GIR - Input Validation
 * Centralized validation functions for all API endpoints
 */

/**
 * Validate and sanitize course name
 * @param string $courseName Raw course name input
 * @return array ['valid' => bool, 'sanitized' => string, 'error' => string]
 */
function validateCourseName($courseName) {
    if (empty($courseName) || !is_string($courseName)) {
        return [
            'valid' => false,
            'sanitized' => '',
            'error' => 'Course name is required'
        ];
    }
    
    $trimmed = trim($courseName);
    if (empty($trimmed)) {
        return [
            'valid' => false,
            'sanitized' => '',
            'error' => 'Course name cannot be empty'
        ];
    }
    
    // Sanitize to prevent XSS
    $sanitized = htmlspecialchars($trimmed, ENT_QUOTES, 'UTF-8');
    
    // Limit length
    if (strlen($sanitized) > 100) {
        $sanitized = substr($sanitized, 0, 100);
    }
    
    return [
        'valid' => true,
        'sanitized' => $sanitized,
        'error' => null
    ];
}

function normalizeGirValue($gir) {
    return $gir === 'y' ? 'y' : 'n';
}

function normalizeFairwayValue($fairway, $par) {
    if ((int)$par === 3) {
        return null;
    }

    if ($fairway === null || $fairway === 'na' || $fairway === 'rough' || $fairway === 'sand' || $fairway === 'n') {
        return 'n';
    }

    if (in_array($fairway, ['y', 'c', 'l', 'r'], true)) {
        return 'y';
    }

    return 'n';
}

function normalizeApproachLieValue($lie) {
    if ($lie === 'c') {
        return 'fairway';
    }

    if (in_array($lie, ['fairway', 'rough', 'sand'], true)) {
        return $lie;
    }

    return null;
}

function normalizeSecondShotLieValue($lie) {
    if ($lie === 'c') {
        return 'fairway';
    }

    if ($lie === 'na') {
        return 'hazard';
    }

    if (in_array($lie, ['fairway', 'rough', 'sand', 'hazard', 'green'], true)) {
        return $lie;
    }

    return null;
}

function positiveIntOrNull($value) {
    return is_numeric($value) && (int)$value > 0 ? (int)$value : null;
}

function nonNegativeIntOrNull($value) {
    return is_numeric($value) && (int)$value >= 0 ? (int)$value : null;
}

function positiveFloatOrNull($value) {
    return is_numeric($value) && (float)$value > 0 ? (float)$value : null;
}

function sanitizeNumericArray($values, $maxItems = 10) {
    if (!is_array($values)) {
        return [];
    }

    $sanitized = [];
    foreach (array_slice($values, 0, $maxItems) as $value) {
        if (is_numeric($value) && (float)$value >= 0) {
            $sanitized[] = (float)$value;
        }
    }

    return $sanitized;
}

/**
 * Validate hole data structure
 * @param array $hole Hole data array
 * @return array ['valid' => bool, 'errors' => array, 'sanitized' => array|null]
 */
function validateHole($hole) {
    $errors = [];
    $sanitized = [];

    if (!is_array($hole)) {
        return [
            'valid' => false,
            'errors' => ['Invalid hole data'],
            'sanitized' => null
        ];
    }
    
    if (!isset($hole['holeNumber']) || !is_numeric($hole['holeNumber']) || $hole['holeNumber'] < 1) {
        $errors[] = 'Invalid hole number';
    }
    
    if (!isset($hole['par']) || !is_numeric($hole['par']) || $hole['par'] < 3 || $hole['par'] > 5) {
        $errors[] = 'Invalid par (must be 3, 4, or 5)';
    }
    
    if (!isset($hole['score']) || !is_numeric($hole['score']) || $hole['score'] < 1) {
        $errors[] = 'Invalid score';
    }
    
    if (!isset($hole['gir'])) {
        $errors[] = 'GIR (Green in Regulation) is required';
    }
    
    if (!isset($hole['putts']) || !is_numeric($hole['putts']) || $hole['putts'] < 0) {
        $errors[] = 'Invalid putts count';
    }
    
    // Fairway is required for par 4 and 5
    $par = isset($hole['par']) ? (int)$hole['par'] : 0;
    if ($par !== 3 && !isset($hole['fairway'])) {
        $errors[] = 'Fairway hit is required for par 4 and par 5';
    }

    if (!empty($errors)) {
        return [
            'valid' => false,
            'errors' => $errors,
            'sanitized' => null
        ];
    }

    $sanitized['holeNumber'] = (int)$hole['holeNumber'];
    $sanitized['par'] = (int)$hole['par'];
    $sanitized['score'] = (int)$hole['score'];
    $sanitized['gir'] = normalizeGirValue($hole['gir']);
    $sanitized['putts'] = (int)$hole['putts'];
    $sanitized['puttDistances'] = sanitizeNumericArray($hole['puttDistances'] ?? [], 6);
    $sanitized['holedOut'] = !empty($hole['holedOut']);
    $sanitized['fairway'] = normalizeFairwayValue($hole['fairway'] ?? null, $sanitized['par']);

    if (($value = positiveIntOrNull($hole['shotsToGreen'] ?? null)) !== null) {
        $sanitized['shotsToGreen'] = $value;
    }

    if (isset($hole['penalty']) && is_string($hole['penalty']) && $hole['penalty'] !== '' && $hole['penalty'] !== '0') {
        $allowedPenalties = ['ob', 'water', 'lost', 'wrong', 'other'];
        $sanitized['penalty'] = in_array($hole['penalty'], $allowedPenalties, true) ? $hole['penalty'] : 'other';
    } else {
        $sanitized['penalty'] = null;
    }

    if (($value = positiveIntOrNull($hole['penaltyStrokes'] ?? null)) !== null) {
        $sanitized['penaltyStrokes'] = $value;
        if ($sanitized['penalty'] === null) {
            $sanitized['penalty'] = 'other';
        }
    }

    foreach (['proximity', 'approachDistance', 'secondShotDistance', 'wedgeShotDistance', 'holeDistance'] as $field) {
        $value = positiveFloatOrNull($hole[$field] ?? null);
        if ($value !== null) {
            $sanitized[$field] = $value;
        }
    }

    $approachLie = normalizeApproachLieValue($hole['approachLie'] ?? null);
    if ($approachLie !== null) {
        $sanitized['approachLie'] = $approachLie;
    }

    $secondShotLie = normalizeSecondShotLieValue($hole['secondShotLie'] ?? null);
    if ($secondShotLie !== null) {
        $sanitized['secondShotLie'] = $secondShotLie;
    }

    if (($value = positiveIntOrNull($hole['secondShotPenalty'] ?? null)) !== null) {
        $sanitized['secondShotPenalty'] = $value;
    }

    if (isset($hole['approachMissLocation']) && is_string($hole['approachMissLocation'])) {
        $allowedMisses = ['short', 'sand', 'long', 'hazard', 'left', 'right', 'fringe', 'fringe-left', 'fringe-right', 'fringe-long', 'fringe-short'];
        if (in_array($hole['approachMissLocation'], $allowedMisses, true)) {
            $sanitized['approachMissLocation'] = $hole['approachMissLocation'];
        }
    }

    $wedgeShotDistances = sanitizeNumericArray($hole['wedgeShotDistances'] ?? [], 3);
    if (!empty($wedgeShotDistances)) {
        $sanitized['wedgeShotDistances'] = $wedgeShotDistances;
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'sanitized' => $sanitized
    ];
}

/**
 * Validate round data structure
 * @param array $roundData Round data array
 * @return array ['valid' => bool, 'errors' => array, 'sanitized' => array]
 */
function validateRoundData($roundData) {
    $errors = [];
    $sanitized = [];
    
    // Validate holes array
    if (!isset($roundData['holes']) || !is_array($roundData['holes'])) {
        $errors[] = 'Holes array is required';
        return ['valid' => false, 'errors' => $errors, 'sanitized' => null];
    }
    
    $holes = $roundData['holes'];
    $sanitizedHoles = [];
    if (empty($holes)) {
        $errors[] = 'At least one hole is required';
    }
    
    // Validate each hole
    foreach ($holes as $index => $hole) {
        $holeValidation = validateHole($hole);
        if (!$holeValidation['valid']) {
            $errors[] = "Hole " . ($index + 1) . ": " . implode(', ', $holeValidation['errors']);
        } elseif (isset($holeValidation['sanitized'])) {
            $sanitizedHoles[] = $holeValidation['sanitized'];
        }
    }
    
    // Validate course name
    $courseName = $roundData['courseName'] ?? '';
    $courseValidation = validateCourseName($courseName);
    if (!$courseValidation['valid']) {
        $errors[] = $courseValidation['error'];
    } else {
        $sanitized['courseName'] = $courseValidation['sanitized'];
    }
    
    // Stats will be recalculated server-side, but we can validate structure if present
    if (isset($roundData['stats']) && !is_array($roundData['stats'])) {
        $errors[] = 'Stats must be an array';
    }
    
    $sanitized['holes'] = $sanitizedHoles;
    if (isset($roundData['mergeIntoRoundId'])) {
        $sanitized['mergeIntoRoundId'] = $roundData['mergeIntoRoundId'];
    }
    if (isset($roundData['completed'])) {
        $sanitized['completed'] = (bool)$roundData['completed'];
    }
    if (isset($roundData['courseMetadata'])) {
        $sanitized['courseMetadata'] = $roundData['courseMetadata'];
    }
    if (isset($roundData['replaceRoundNumber'])) {
        $sanitized['replaceRoundNumber'] = (int)$roundData['replaceRoundNumber'];
    }
    if (isset($roundData['roundId']) && is_string($roundData['roundId'])) {
        $roundId = trim($roundData['roundId']);
        if ($roundId !== '' && preg_match('/^[A-Za-z0-9._:-]{1,100}$/', $roundId)) {
            $sanitized['roundId'] = $roundId;
        }
    }
    if (isset($roundData['clientRequestId']) && is_string($roundData['clientRequestId'])) {
        $clientRequestId = trim($roundData['clientRequestId']);
        if ($clientRequestId !== '' && preg_match('/^[A-Za-z0-9._:-]{1,100}$/', $clientRequestId)) {
            $sanitized['clientRequestId'] = $clientRequestId;
        }
    }

    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'sanitized' => $sanitized
    ];
}

/**
 * Validate email address
 * @param string $email Email address
 * @return bool
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate password
 * @param string $password Password
 * @param int $minLength Minimum length (default 8)
 * @return array ['valid' => bool, 'error' => string]
 */
function validatePassword($password, $minLength = 8) {
    if (empty($password) || !is_string($password)) {
        return ['valid' => false, 'error' => 'Password is required'];
    }

    if (strlen($password) < $minLength) {
        return ['valid' => false, 'error' => "Password must be at least $minLength characters"];
    }

    return ['valid' => true, 'error' => null];
}

