<?php
// config.php
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Change to your MySQL username
define('DB_PASS', '');     // Change to your MySQL password
define('DB_NAME', 'weather_dashboard');

// OpenWeatherMap API Key (Put your actual key here)
define('API_KEY', 'f8572bfdb5c5708eb0942863ded259f6');

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Database connection function
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        return null;
    }
    
    return $conn;
}

// Create tables if they don't exist
function createTablesIfNeeded($conn) {
    // Search history table
    $sql = "CREATE TABLE IF NOT EXISTS search_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        city VARCHAR(100) NOT NULL,
        country_code VARCHAR(10),
        search_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_city (city),
        INDEX idx_time (search_timestamp)
    )";
    
    if (!$conn->query($sql)) {
        error_log("Error creating table: " . $conn->error);
    }
}
?>