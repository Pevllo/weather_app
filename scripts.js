    // IMPORTANT: Your API key is now in PHP config.php
    const API_KEY = 'f8572bfdb5c5708eb0942863ded259f6';
    const BASE_URL = 'https://api.openweathermap.org/data/2.5';
    let currentUnit = 'metric';
    let searchHistory = [];
    let currentCity = '';

    const weatherIcons = {
        '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };

    let cityInput = document.getElementById("cityInput");

    // Sidebar functions
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }

    function switchPage(page) {
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        document.getElementById(page + 'Page').classList.add('active');
        
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        closeSidebar();
    }

    // Enter key search
    document.getElementById('cityInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchWeather();
    });

    // Use PHP proxy for API calls
    async function fetchWeatherData(city) {
        try {
            const response = await fetch(
                `proxy.php?action=current&city=${encodeURIComponent(city)}&units=${currentUnit}`
            );
            
            if (!response.ok) {
                throw new Error('City not found');
            }
            
            return await response.json();
        } catch (error) {
            alert('Error: ' + error.message + '. Please check the city name and try again.');
            throw error;
        }
    }

    async function fetchForecastData(city) {
        try {
            const response = await fetch(
                `proxy.php?action=forecast&city=${encodeURIComponent(city)}&units=${currentUnit}`
            );
            
            if (!response.ok) {
                throw new Error('Forecast data not available');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Forecast error:', error);
            return null;
        }
    }

    async function quickSearch(c){
        cityInput.value = c;
        searchWeather();
        cityInput.value = "";
        closeSidebar();
        switchPage('dashboard');
    }

    async function searchWeather() {
        const city = document.getElementById('cityInput').value.trim();
        if (!city) {
            alert('Please enter a city name');
            return;
        }

        currentCity = city;
        document.getElementById('loading').classList.remove('hidden');

        try {
            const currentWeather = await fetchWeatherData(city);
            displayCurrentWeather(currentWeather);
            
            const forecastData = await fetchForecastData(city);
            if (forecastData) {
                displayForecast(forecastData);
            }
            
            addToHistory(city, currentWeather);
        } catch (error) {
            console.error('Error:', error);
        }

        document.getElementById('loading').classList.add('hidden');
    }

    function displayCurrentWeather(data) {
        const tempSymbol = currentUnit === 'metric' ? '°C' : '°F';
        const now = new Date();
        
        document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('dateTime').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}${tempSymbol}`;
        document.getElementById('feelsLike').textContent = `Feels like ${Math.round(data.main.feels_like)}${tempSymbol}`;
        document.getElementById('weatherIcon').textContent = weatherIcons[data.weather[0].icon] || '🌤️';
        document.getElementById('weatherDesc').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = `${Math.round(data.main.humidity)}%`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed.toFixed(1)} m/s`;
        document.getElementById('pressure').textContent = `${Math.round(data.main.pressure)} hPa`;
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;

        const sunrise = new Date(data.sys.sunrise * 1000);
        const sunset = new Date(data.sys.sunset * 1000);
        document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        document.getElementById('sunset').textContent = sunset.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
    }

    function displayForecast(forecastData) {
        const forecastGrid = document.getElementById('forecastGrid');
        const tempSymbol = currentUnit === 'metric' ? '°C' : '°F';
        forecastGrid.innerHTML = '';
        
        // Group forecasts by day
        const dailyForecasts = {};
        
        forecastData.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const hour = date.getHours();
            
            // Only take forecasts for midday (around 12 PM) for daily forecast
            if (!dailyForecasts[day] || (hour >= 11 && hour <= 13)) {
                dailyForecasts[day] = {
                    day: day,
                    temp: Math.round(forecast.main.temp),
                    icon: weatherIcons[forecast.weather[0].icon] || '🌤️',
                    description: forecast.weather[0].description,
                    date: date
                };
            }
        });
        
        // Convert to array and take next 5 days
        const forecastArray = Object.values(dailyForecasts)
            .sort((a, b) => a.date - b.date)
            .slice(0, 5);
        
        if (forecastArray.length === 0) {
            forecastGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; opacity: 0.7; padding: 20px;">
                    No forecast data available
                </div>
            `;
            return;
        }
        
        // Display forecast cards
        forecastArray.forEach(forecast => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.innerHTML = `
                <div class="forecast-day">${forecast.day}</div>
                <div class="forecast-icon">${forecast.icon}</div>
                <div class="forecast-temp">${forecast.temp}${tempSymbol}</div>
                <div class="forecast-desc">${forecast.description}</div>
            `;
            forecastGrid.appendChild(forecastCard);
        });
    }

    // Save to database via PHP API
    async function addToHistory(city, weatherData) {
        try {
            const response = await fetch('api/save-search.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    city: city,
                    country: weatherData.sys.country
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Refresh history from database
                await loadHistoryFromDatabase();
            }
        } catch (error) {
            console.error('Error saving to database:', error);
            // Fallback to localStorage
            fallbackLocalHistory(city, weatherData);
        }
    }

    // Fallback to localStorage if database fails
    function fallbackLocalHistory(city, weatherData) {
        const historyItem = {
            city: city,
            country: weatherData.sys.country,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            searchTime: new Date().getTime()
        };
        
        const existingIndex = searchHistory.findIndex(item => 
            item.city.toLowerCase() === city.toLowerCase()
        );
        
        if (existingIndex !== -1) {
            searchHistory.splice(existingIndex, 1);
        }
        
        searchHistory.unshift(historyItem);
        if (searchHistory.length > 10) {
            searchHistory = searchHistory.slice(0, 10);
        }
        
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        updateHistoryDisplay();
    }

    // Load history from database
    async function loadHistoryFromDatabase() {
        try {
            const response = await fetch('api/get-history.php?limit=10');
            const data = await response.json();
            
            if (data.success) {
                searchHistory = data.history.map(item => ({
                    city: item.city,
                    country: item.country,
                    timestamp: item.timestamp,
                    searchTime: new Date().getTime()
                }));
                
                updateHistoryDisplay();
            }
        } catch (error) {
            console.error('Error loading history:', error);
            // Fallback to localStorage
            loadFromLocalStorage();
        }
    }

    // Load from localStorage fallback
    function loadFromLocalStorage() {
        const localHistory = localStorage.getItem('searchHistory');
        if (localHistory) {
            searchHistory = JSON.parse(localHistory);
            updateHistoryDisplay();
        }
    }

    function updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        
        if (searchHistory.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 40px; opacity: 0.7;">
                    No search history yet
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = '';
        
        searchHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.onclick = () => {
                document.getElementById('cityInput').value = item.city;
                searchWeather();
                switchPage('dashboard');
            };
            
            historyItem.innerHTML = `
                <div class="history-left">
                    <div class="history-icon">📍</div>
                    <div class="history-info">
                        <h3>${item.city}, ${item.country}</h3>
                        <small style="opacity: 0.7; font-size: 12px;">Last searched: ${item.timestamp}</small>
                    </div>
                </div>
                <div class="history-right">
                    <button class="remove-btn" style="
                        background: rgba(255, 50, 50, 0.2);
                        border: none;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 5px;
                        font-size: 12px;
                        cursor: pointer;
                    " onclick="removeFromHistory('${item.city}')">Remove</button>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    function removeFromHistory(city) {
        event.stopPropagation();
        searchHistory = searchHistory.filter(item => 
            item.city.toLowerCase() !== city.toLowerCase()
        );
        updateHistoryDisplay();
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    function changeUnit(unit) {
        currentUnit = unit;
        localStorage.setItem('weatherUnit', unit);
        
        document.querySelectorAll('input[name="unit"]').forEach(radio => {
            radio.checked = (radio.value === unit);
        });
        
        // Only refresh if there's a city to search
        if (currentCity) {
            searchWeather();
        }
    }

    async function clearAllHistory() {
    if (confirm('Are you sure you want to clear all search history?')) {
        try {
            const response = await fetch('api/clear-history.php', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                searchHistory = [];
                updateHistoryDisplay();
                alert('History cleared successfully');
            } else {
                alert('Failed to clear history: ' + result.error);
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('Error clearing history. Please try again.');
        }
    }
}

    // Create api/clear-history.php file
    function createClearHistoryFile() {
        // This is just for reference - create this file manually
        console.log('Create clear-history.php with: <?php require_once "../config.php"; $conn = getDBConnection(); if($conn) $conn->query("DELETE FROM search_history"); echo json_encode(["success" => true]); ?>');
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Load settings
        const savedUnit = localStorage.getItem('weatherUnit');
        if (savedUnit) {
            currentUnit = savedUnit;
            document.querySelectorAll('input[name="unit"]').forEach(radio => {
                radio.checked = (radio.value === savedUnit);
            });
        }
        
        // Load history
        loadHistoryFromDatabase();
        
        // Initial weather search
        searchWeather();
        cityInput.value = "";
    });
