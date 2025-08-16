import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../services/api';
import './Weather.css';

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using default Coimbatore coordinates for now
        const response = await weatherAPI.getCurrent(11.0168, 76.9558);
        if (response.success) {
          setWeather(response.data);
        } else {
          throw new Error('Failed to fetch weather data');
        }
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return <div className="weather-box loading">Loading weather...</div>;
  }

  if (error || !weather) {
    return <div className="weather-box error">Weather unavailable</div>;
  }

  return (
    <div className="weather-box">
      <div className="weather-icon">{weather.icon}</div>
      <div className="weather-details">
        <div className="weather-temp">{weather.temperature}°C</div>
        <div className="weather-condition">{weather.condition}</div>
      </div>
    </div>
  );
}
