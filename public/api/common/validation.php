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

/**
 * Validate hole data structure
 * @param array $hole Hole data array
 * @return array ['valid' => bool, 'errors' => array]
 */
function validateHole($hole) {
    $errors = [];
    
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
    
    return [
        'valid' => empty($errors),
        'errors' => $errors
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
    if (empty($holes)) {
        $errors[] = 'At least one hole is required';
    }
    
    // Validate each hole
    foreach ($holes as $index => $hole) {
        $holeValidation = validateHole($hole);
        if (!$holeValidation['valid']) {
            $errors[] = "Hole " . ($index + 1) . ": " . implode(', ', $holeValidation['errors']);
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
    
    $sanitized['holes'] = $holes;
    if (isset($roundData['mergeIntoRoundId'])) {
        $sanitized['mergeIntoRoundId'] = $roundData['mergeIntoRoundId'];
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

