<?php
/**
 * Karl's GIR - Golf Course Search (Google Places API Proxy)
 * Searches for golf courses near GPS coordinates
 * API key is stored server-side for security
 */

require_once __DIR__ . '/../common/cors.php';
require_once __DIR__ . '/../common/rate-limiter.php';
require_once __DIR__ . '/../common/logger.php';
require_once __DIR__ . '/../common/environment.php';

header('Content-Type: application/json');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Rate limit: 30 searches per 15 minutes per IP
$rateLimit = checkRateLimit('course-search', 30, 15);
if (!$rateLimit['allowed']) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => $rateLimit['message']]);
    exit;
}

// Get parameters
$latitude = isset($_GET['latitude']) ? floatval($_GET['latitude']) : null;
$longitude = isset($_GET['longitude']) ? floatval($_GET['longitude']) : null;
$radius = isset($_GET['radius']) ? intval($_GET['radius']) : 40234; // Default ~25 miles in meters

// Validate
if ($latitude === null || $longitude === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'latitude and longitude are required']);
    exit;
}

if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid coordinates']);
    exit;
}

// Cap radius at 50 miles (~80km)
$maxRadius = 80467; // 50 miles in meters
if ($radius > $maxRadius) {
    $radius = $maxRadius;
}

// Load Google API key from config file (not in web root)
$apiKey = getGoogleApiKey();
if (!$apiKey) {
    http_response_code(500);
    logError('Google Places API key not configured');
    echo json_encode(['success' => false, 'message' => 'Course search is not configured. Please contact support.']);
    exit;
}

// Call Google Places Nearby Search API
$url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' . http_build_query([
    'location' => "$latitude,$longitude",
    'radius' => $radius,
    'type' => 'golf_course',
    'key' => $apiKey,
]);

$ch = curl_init();
$curlOpts = [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true,
];

// Disable SSL verification on localhost (Laragon may lack CA certs)
if (isDevelopment()) {
    $curlOpts[CURLOPT_SSL_VERIFYPEER] = false;
    $curlOpts[CURLOPT_SSL_VERIFYHOST] = 0;
}

curl_setopt_array($ch, $curlOpts);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
$curlErrno = curl_errno($ch);
curl_close($ch);

if ($curlError) {
    logError('Google Places API curl error: ' . $curlError . ' (errno: ' . $curlErrno . ')');
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to search for courses. Please try again.',
        'debug' => isDevelopment() ? $curlError : null,
    ]);
    exit;
}

if ($httpCode !== 200) {
    logError('Google Places API HTTP error: ' . $httpCode);
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Course search service unavailable. Please try again.']);
    exit;
}

$data = json_decode($response, true);

if (!$data || ($data['status'] ?? '') === 'REQUEST_DENIED') {
    $googleError = $data['error_message'] ?? 'Unknown';
    logError('Google Places API denied: ' . $googleError);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Course search configuration error.',
        'debug' => isDevelopment() ? $googleError : null,
    ]);
    exit;
}

if ($data['status'] === 'ZERO_RESULTS' || empty($data['results'])) {
    echo json_encode([
        'success' => true,
        'courses' => [],
        'message' => 'No golf courses found nearby.'
    ]);
    exit;
}

// Transform Google Places results
$courses = [];
foreach ($data['results'] as $place) {
    $courseLat = $place['geometry']['location']['lat'] ?? null;
    $courseLng = $place['geometry']['location']['lng'] ?? null;

    if (!$courseLat || !$courseLng) continue;

    // Calculate distance in miles using Haversine
    $distance = haversineDistance($latitude, $longitude, $courseLat, $courseLng);

    $courses[] = [
        'clubName' => $place['name'] ?? 'Unknown Course',
        'courseName' => '', // Google doesn't separate club vs course name
        'latitude' => $courseLat,
        'longitude' => $courseLng,
        'placeId' => $place['place_id'] ?? null,
        'distance' => round($distance, 1),
        'rating' => $place['rating'] ?? null,
        'address' => $place['vicinity'] ?? null,
    ];
}

// Sort by distance
usort($courses, function ($a, $b) {
    return ($a['distance'] ?? 999) <=> ($b['distance'] ?? 999);
});

echo json_encode([
    'success' => true,
    'courses' => $courses,
]);

// --- Helper Functions ---

/**
 * Haversine distance in miles
 */
function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $R = 3959; // Earth's radius in miles
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}

/**
 * Load Google API key from server-side config
 */
function getGoogleApiKey() {
    // Try environment variable first
    $key = getenv('GOOGLE_PLACES_API_KEY');
    if ($key) return $key;

    // Try config file (stored outside web root for security)
    $configPaths = [
        __DIR__ . '/../../.google-api-key',   // Project root (dev)
        dirname($_SERVER['DOCUMENT_ROOT']) . '/.google-api-key', // Above web root (prod)
    ];

    foreach ($configPaths as $path) {
        if (file_exists($path)) {
            $key = trim(file_get_contents($path));
            if ($key) return $key;
        }
    }

    return null;
}
?>
