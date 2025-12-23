<?php
// api/clear-history.php
require_once '../config.php';

// Set JSON header
header('Content-Type: application/json');

// Get database connection
$conn = getDBConnection();

if (!$conn) {
    echo json_encode([
        'success' => false, 
        'error' => 'Database connection failed'
    ]);
    exit;
}

// Delete all records from search_history table
$sql = "DELETE FROM search_history";
$success = $conn->query($sql);

$conn->close();

echo json_encode([
    'success' => $success,
    'message' => $success ? 'All search history cleared successfully' : 'Failed to clear history'
]);
?>