import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { weatherAPI, serviceAPI } from '../services/api';
import './HomePage.css';
import '../styles/Page.css';

const categories = [
  { 
    id: 'meals', 
    name: 'Meals', 
    emoji: '🍽️', 
    filter: 'Meals',
    description: 'Full Meals ₹25-50',
    color: '#FF6700'
  },
  { 
    id: 'tiffin', 
    name: 'Tiffin', 
    emoji: '🥞', 
    filter: 'Tiffin',
    description: 'Breakfast ₹15-25',
    color: '#E74C3C'
  },
  { 
    id: 'free', 
    name: 'Free Food', 
    emoji: '🆓', 
    filter: 'Free Food',
    description: 'Completely Free',
    color: '#27AE60'
  },
  { 
    id: 'snacks', 
    name: 'Snacks', 
    emoji: '☕', 
    filter: 'Tea & Snacks',
    description: 'Tea & Quick Bites',
    color: '#F39C12'
  }
];

const weatherIcons = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  clear: '🌙'
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState({
    location: 'Coimbatore',
    temperature: 28,
    condition: 'sunny',
    description: 'Sunny',
    humidity: 65,
    windSpeed: 12,
    feelsLike: 32
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Fetch weather data on component mount
    fetchWeatherData();

    // Update weather every 10 minutes
    const weatherTimer = setInterval(fetchWeatherData, 10 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  const fetchWeatherData = async () => {
    setIsWeatherLoading(true);
    try {
      // Fetch real weather data from backend
      const response = await weatherAPI.getCurrent();
      const weatherData = response.data || response;
      
      setWeather({
        location: weatherData.location.name,
        temperature: weatherData.temperature,
        condition: weatherData.icon,
        description: weatherData.condition,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        feelsLike: weatherData.feelsLike
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Navigate with animation delay
    setTimeout(() => {
      navigate(`/map?filter=${category.filter}&category=${category.name}`);
    }, 200);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const refreshWeather = () => {
    fetchWeatherData();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <main className="home-container page-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="user-greeting">
            <h1 className="greeting-text">Hello, {user?.name?.split(' ')[0] || 'User'}!</h1>
            <p className="greeting-subtitle">Welcome to Namma City</p>
          </div>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Weather Card */}
      <section className={`weather-card ${isWeatherLoading ? 'loading' : ''}`} role="region" aria-label="Current weather">
        <div className="weather-header">
          <div className="location-time">
            <h2 className="location">
              📍 {weather.location}
            </h2>
            <p className="current-time">{formatTime(currentTime)}</p>
          </div>
          <button 
            className="weather-refresh"
            onClick={refreshWeather}
            disabled={isWeatherLoading}
            aria-label="Refresh weather"
          >
            {isWeatherLoading ? '⏳' : '🔄'}
          </button>
        </div>
        
        <div className="weather-main">
          <div className="weather-primary">
            <div className="weather-icon-large">
              {weatherIcons[weather.condition]}
            </div>
            <div className="temperature-section">
              <div className="temperature">
                {weather.temperature}°C
              </div>
              <p className="weather-description">{weather.description}</p>
              <p className="feels-like">Feels like {weather.feelsLike}°C</p>
            </div>
          </div>
          
          <div className="weather-details">
            <div className="weather-stat">
              <span className="stat-icon">💧</span>
              <span className="stat-value">{weather.humidity}%</span>
              <span className="stat-label">Humidity</span>
            </div>
            <div className="weather-stat">
              <span className="stat-icon">💨</span>
              <span className="stat-value">{weather.windSpeed} km/h</span>
              <span className="stat-label">Wind</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section" role="region" aria-label="Service categories">
        <div className="section-header">
          <h2 className="section-title">What are you looking for?</h2>
          <p className="section-subtitle">Explore services in your city</p>
        </div>
        
        <div className="categories-container">
          <div className="categories-scroll" role="list">
            {categories.map((category, index) => (
              <button
                key={category.id}
                className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
                onClick={() => handleCategoryClick(category)}
                role="listitem"
                aria-label={`Find ${category.description}`}
                style={{
                  '--category-color': category.color,
                  '--animation-delay': `${index * 0.1}s`
                }}
              >
                <div className="category-emoji">
                  {category.emoji}
                </div>
                <span className="category-name">
                  {category.name}
                </span>
                <div className="category-glow"></div>
                <div className="category-arrow">→</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions" role="region" aria-label="Quick actions">
        <div className="home-actions-centered">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/map')}
            aria-label="Explore the map"
          >
            <span className="action-icon">🗺️</span>
            <span className="action-text">
              <strong>Explore Map</strong>
              <small>Find services nearby</small>
            </span>
          </button>
        </div>
        

      </section>
      {/* Footer */}
      <footer className="home-footer">
        <p className="footer-text">
          Made with ❤️ for Coimbatore
        </p>
        <p className="footer-version">
          Namma City v1.0
        </p>
      </footer>
    </main>
  );
}
