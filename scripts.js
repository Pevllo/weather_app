// ===== Weather Dashboard JS (Full Edited Version) =====
// Uses PHP proxy for BOTH current weather + forecast:
//   proxy.php?action=current&city=Cairo&units=metric|imperial
//   proxy.php?action=forecast&city=Cairo&units=metric|imperial
// API key is NOT in JS anymore (it stays in PHP config.php)

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

// ---------------- Sidebar functions ----------------
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
  // relies on inline onclick passing event in HTML (as your original did)
  event.currentTarget.classList.add('active');

  closeSidebar();
}

// Enter key search
document.getElementById('cityInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') searchWeather();
});

// ---------------- Proxy API calls ----------------
async function fetchWeatherData(city) {
  const response = await fetch(
    `proxy.php?action=current&city=${encodeURIComponent(city)}&units=${currentUnit}`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = (data && (data.error || data.message)) ? (data.error || data.message) : 'City not found';
    throw new Error(msg);
  }
  if (data && data.error) throw new Error(data.error);

  return data;
}

async function fetchForecastData(city) {
  const response = await fetch(
    `proxy.php?action=forecast&city=${encodeURIComponent(city)}&units=${currentUnit}`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = (data && (data.error || data.message)) ? (data.error || data.message) : 'Forecast not available';
    throw new Error(msg);
  }
  if (data && data.error) throw new Error(data.error);

  return data;
}

// ---------------- Search flow ----------------
async function quickSearch(c) {
  cityInput.value = c;
  await searchWeather();
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
  document.getElementById('loading')?.classList.remove('hidden');

  try {
    const currentWeather = await fetchWeatherData(city);
    displayCurrentWeather(currentWeather);

    const forecastData = await fetchForecastData(city);
    displayForecast(forecastData);

    addToHistory(city, currentWeather);
  } catch (error) {
    alert('Error: ' + error.message + '. Please check the city name and try again.');
    console.error('Error:', error);
  }

  document.getElementById('loading')?.classList.add('hidden');
}

// ---------------- UI rendering ----------------
function displayCurrentWeather(data) {
  const tempSymbol = currentUnit === 'metric' ? '°C' : '°F';
  const windUnit = currentUnit === 'metric' ? 'm/s' : 'mph';
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
  document.getElementById('windSpeed').textContent = `${Number(data.wind.speed).toFixed(1)} ${windUnit}`;
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
  if (!forecastGrid) return;

  const tempSymbol = currentUnit === 'metric' ? '°C' : '°F';
  forecastGrid.innerHTML = '';

  // Group forecasts by day (OpenWeather forecast is 3-hour steps)
  const dailyForecasts = {};

  forecastData.list.forEach(forecast => {
    const date = new Date(forecast.dt * 1000);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const hour = date.getHours();

    // Prefer around midday to represent the day
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

// ---------------- Search history (DB + fallback) ----------------
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
      await loadHistoryFromDatabase();
    } else {
      fallbackLocalHistory(city, weatherData);
    }
  } catch (error) {
    console.error('Error saving to database:', error);
    fallbackLocalHistory(city, weatherData);
  }
}

function fallbackLocalHistory(city, weatherData) {
  const historyItem = {
    city: city,
    country: weatherData.sys.country,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    searchTime: Date.now()
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

async function loadHistoryFromDatabase() {
  try {
    const response = await fetch('api/get-history.php?limit=10');
    const data = await response.json();

    if (data.success) {
      searchHistory = data.history.map(item => ({
        city: item.city,
        country: item.country,
        timestamp: item.timestamp,
        searchTime: Date.now()
      }));
      updateHistoryDisplay();
    } else {
      loadFromLocalStorage();
    }
  } catch (error) {
    console.error('Error loading history:', error);
    loadFromLocalStorage();
  }
}

function loadFromLocalStorage() {
  const localHistory = localStorage.getItem('searchHistory');
  if (localHistory) {
    searchHistory = JSON.parse(localHistory);
    updateHistoryDisplay();
  }
}

function updateHistoryDisplay() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

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

// ---------------- Units + clearing history ----------------
function changeUnit(unit) {
  currentUnit = unit;
  localStorage.setItem('weatherUnit', unit);

  document.querySelectorAll('input[name="unit"]').forEach(radio => {
    radio.checked = (radio.value === unit);
  });

  if (currentCity) {
    searchWeather();
  }
}

async function clearAllHistory() {
  if (confirm('Are you sure you want to clear all search history?')) {
    try {
      const response = await fetch('api/clear-history.php', { method: 'POST' });
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

// ---------------- Init (Default Cairo) ----------------
document.addEventListener('DOMContentLoaded', () => {
  // Load saved unit
  const savedUnit = localStorage.getItem('weatherUnit');
  if (savedUnit) {
    currentUnit = savedUnit;
    document.querySelectorAll('input[name="unit"]').forEach(radio => {
      radio.checked = (radio.value === savedUnit);
    });
  }

  // Load history
  loadHistoryFromDatabase();

  // Default city = Cairo
  currentCity = 'Cairo';
  document.getElementById('cityInput').value = 'Cairo';
  searchWeather();
});
