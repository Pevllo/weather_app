<?php
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['city']) || empty(trim($data['city']))) {
    echo json_encode(['success' => false]);
    exit;
}

$conn = getDBConnection();
if (!$conn) {
    echo json_encode(['success' => false]);
    exit;
}

$city = trim($conn->real_escape_string($data['city']));
$country = isset($data['country']) ? $conn->real_escape_string($data['country']) : '';

// Check if exists
$check = $conn->query("SELECT id FROM search_history 
                      WHERE city = '$city' AND country_code = '$country' 
                      LIMIT 1");

if ($check->num_rows > 0) {
    $conn->query("UPDATE search_history 
                 SET search_timestamp = CURRENT_TIMESTAMP 
                 WHERE city = '$city' AND country_code = '$country'");
} else {
    $conn->query("INSERT INTO search_history (city, country_code) 
                 VALUES ('$city', '$country')");
}

echo json_encode(['success' => true]);
?>