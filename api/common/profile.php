<?php
/**
 * Karl's GIR - User Profile Helpers
 */

require_once __DIR__ . '/file-lock.php';

function getProfileFilePath($userDir) {
    return rtrim($userDir, '/\\') . '/profile.json';
}

function buildDefaultProfile($email = '', $existing = null) {
    $createdAt = is_array($existing) && !empty($existing['createdAt']) ? $existing['createdAt'] : date('c');

    return [
        'email' => $email,
        'username' => is_array($existing) && isset($existing['username']) && is_string($existing['username'])
            ? trim($existing['username'])
            : '',
        'createdAt' => $createdAt,
        'updatedAt' => date('c'),
    ];
}

function readUserProfile($userDir, $email = '') {
    $profilePath = getProfileFilePath($userDir);
    $existing = readJsonFile($profilePath, null);

    if (!is_array($existing)) {
        return buildDefaultProfile($email);
    }

    $profile = buildDefaultProfile($email ?: ($existing['email'] ?? ''), $existing);
    if (!empty($existing['email']) && is_string($existing['email'])) {
        $profile['email'] = trim($existing['email']);
    }

    return $profile;
}

function writeUserProfile($userDir, $profile) {
    $profilePath = getProfileFilePath($userDir);
    return writeJsonFile($profilePath, $profile);
}
