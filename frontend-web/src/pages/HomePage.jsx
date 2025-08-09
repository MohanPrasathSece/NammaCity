import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const categories = [
  { id: 'food', name: 'Food', emoji: '🍛', filter: 'restaurant' },
  { id: 'stay', name: 'Stay', emoji: '🛏', filter: 'hotel' },
  { id: 'services', name: 'Services', emoji: '🚻', filter: 'utility' },
  { id: 'learn', name: 'Learn', emoji: '📚', filter: 'education' }
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
  const [weather, setWeather] = useState({
    location: 'Coimbatore',
    temperature: 28,
    condition: 'sunny',
    description: 'Sunny'
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Mock weather data - in real app, fetch from weather API
    const mockWeatherData = () => {
      const conditions = ['sunny', 'cloudy', 'rainy'];
      const temps = [25, 26, 27, 28, 29, 30, 31];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      const randomTemp = temps[Math.floor(Math.random() * temps.length)];
      
      setWeather({
        location: 'Coimbatore',
        temperature: randomTemp,
        condition: randomCondition,
        description: randomCondition.charAt(0).toUpperCase() + randomCondition.slice(1)
      });
    };

    // Simulate weather update every 5 minutes
    const weatherTimer = setInterval(mockWeatherData, 300000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  const handleCategoryClick = (category) => {
    navigate(`/map?filter=${category.filter}`);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <main className="home-container">
      {/* Weather Card */}
      <section className="weather-card" role="region" aria-label="Current weather">
        <div className="weather-header">
          <div className="location-time">
            <h1 className="location">{weather.location}</h1>
            <p className="current-time">{formatTime(currentTime)}</p>
          </div>
          <div className="weather-icon">
            {weatherIcons[weather.condition]}
          </div>
        </div>
        
        <div className="weather-main">
          <div className="temperature">
            {weather.temperature}°C
          </div>
          <p className="weather-description">{weather.description}</p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section" role="region" aria-label="Service categories">
        <h2 className="section-title">What are you looking for?</h2>
        
        <div className="categories-container">
          <div className="categories-scroll" role="list">
            {categories.map((category) => (
              <button
                key={category.id}
                className="category-card"
                onClick={() => handleCategoryClick(category)}
                role="listitem"
                aria-label={`Find ${category.name} services`}
              >
                <div className="category-emoji">
                  {category.emoji}
                </div>
                <span className="category-name">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions" role="region" aria-label="Quick actions">
        <button 
          className="action-btn primary"
          onClick={() => navigate('/map')}
          aria-label="View all services on map"
        >
          🗺️ Explore Map
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/dashboard')}
          aria-label="Go to dashboard"
        >
          📊 Dashboard
        </button>
      </section>
    </main>
  );
}
