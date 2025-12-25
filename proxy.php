<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$city  = trim($_GET['city'] ?? '');
$action = trim($_GET['action'] ?? 'current');   // current | forecast
$units  = trim($_GET['units'] ?? 'metric');     // metric | imperial

if ($city === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Use: ?action=current|forecast&city=Cairo&units=metric|imperial']);
    exit;
}

if (!in_array($action, ['current', 'forecast'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
    exit;
}

if (!in_array($units, ['metric', 'imperial'], true)) {
    $units = 'metric';
}

// Select endpoint based on action
$endpoint = ($action === 'forecast') ? 'forecast' : 'weather';

$url = "https://api.openweathermap.org/data/2.5/$endpoint?q=" . urlencode($city)
     . "&appid=" . API_KEY
     . "&units=" . urlencode($units);

// Call OpenWeather with cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

$response = curl_exec($ch);
$http     = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$err      = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Request failed', 'details' => $err]);
    exit;
}

http_response_code($http ?: 200);
echo $response;
