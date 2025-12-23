<?php
require_once '../config.php';

$conn = getDBConnection();
if (!$conn) {
    echo json_encode(['success' => false, 'history' => []]);
    exit;
}

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$limit = min($limit, 50);

$sql = "SELECT city, country_code, MAX(search_timestamp) as last_searched
        FROM search_history 
        GROUP BY city, country_code
        ORDER BY last_searched DESC 
        LIMIT $limit";

$result = $conn->query($sql);
$history = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $history[] = [
            'city' => $row['city'],
            'country' => $row['country_code'],
            'timestamp' => date('h:i A', strtotime($row['last_searched']))
        ];
    }
}

echo json_encode(['success' => true, 'history' => $history]);
?>