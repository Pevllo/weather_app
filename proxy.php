<?php
require_once 'config.php';

$action = $_GET['action'] ?? 'current';
$city = $_GET['city'] ?? '';
$units = $_GET['units'] ?? 'metric';

if (empty($city)) {
    echo json_encode(['error' => 'City parameter is required']);
    exit;
}

$endpoints = [
    'current' => 'https://api.openweathermap.org/data/2.5/weather',
    'forecast' => 'https://api.openweathermap.org/data/2.5/forecast'
];

if (!isset($endpoints[$action])) {
    echo json_encode(['error' => 'Invalid action']);
    exit;
}

$url = $endpoints[$action] . "?q=" . urlencode($city) . 
       "&appid=" . API_KEY . "&units=" . $units;

$response = file_get_contents($url);
if ($response === FALSE) {
    echo json_encode(['error' => 'Failed to fetch weather data']);
    exit;
}

header('Content-Type: application/json');
echo $response;
?>