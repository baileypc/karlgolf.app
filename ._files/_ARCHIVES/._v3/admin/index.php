<?php
/**
 * Karl's GIR - Admin Dashboard Entry Point
 * Simple redirect to index.html with cache prevention
 */

// Force no-cache headers before redirect
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Location: index.html?nocache=' . time());
exit;
?>

