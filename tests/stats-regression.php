<?php
require_once __DIR__ . '/../api/common/stats-calculator.php';
require_once __DIR__ . '/../api/common/validation.php';

function assertSameValue($expected, $actual, $message) {
    if ($expected !== $actual) {
        fwrite(STDERR, "FAIL: {$message}\nExpected: " . var_export($expected, true) . "\nActual:   " . var_export($actual, true) . "\n");
        exit(1);
    }
}

function assertFloatValue($expected, $actual, $message) {
    if (abs((float)$expected - (float)$actual) > 0.0001) {
        fwrite(STDERR, "FAIL: {$message}\nExpected: {$expected}\nActual:   {$actual}\n");
        exit(1);
    }
}

$stats = calculateStats([
    [
        'holeNumber' => 1,
        'par' => 4,
        'score' => 4,
        'gir' => 'y',
        'putts' => 2,
        'puttDistances' => [20, 2],
        'fairway' => 'c',
        'approachLie' => 'fairway',
    ],
    [
        'holeNumber' => 2,
        'par' => 5,
        'score' => 4,
        'gir' => 'y',
        'putts' => 1,
        'puttDistances' => [8],
        'fairway' => 'y',
        'secondShotLie' => 'green',
        'secondShotDistance' => 230,
    ],
    [
        'holeNumber' => 3,
        'par' => 4,
        'score' => 6,
        'gir' => 'n',
        'putts' => 2,
        'puttDistances' => [12, 1],
        'fairway' => 'n',
        'penalty' => 'other',
        'penaltyStrokes' => 2,
    ],
]);

assertSameValue(2, $stats['fairwaysHit'], 'legacy c/l/r fairway values count as fairway hits');
assertFloatValue(1.5, $stats['puttsPerGIR'], 'putts per GIR averages only GIR holes');
assertSameValue(2, $stats['totalPenaltyStrokes'], 'numeric penalty strokes are totaled');
assertSameValue(2, $stats['girByLie']['fairway']['gir'], 'par 5 on-green second shot contributes to fairway GIR-by-lie');

$validation = validateRoundData([
    'courseName' => 'Regression GC',
    'holes' => [
        [
            'holeNumber' => 1,
            'par' => 4,
            'score' => 5,
            'gir' => 'n',
            'putts' => 2,
            'puttDistances' => [10, 1],
            'fairway' => 'l',
            'penaltyStrokes' => 1,
            'secondShotLie' => 'c',
        ],
    ],
]);

assertSameValue(true, $validation['valid'], 'round validation accepts local/legacy fairway values');
assertSameValue('y', $validation['sanitized']['holes'][0]['fairway'], 'validation normalizes local fairway hit to API yes');
assertSameValue('other', $validation['sanitized']['holes'][0]['penalty'], 'validation marks numeric penalty strokes as penalty holes');

echo "Stats regression tests passed\n";
