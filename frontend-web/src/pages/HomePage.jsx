import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const services = [
  { id: 'food', name: 'Find Free Food', icon: '🍔', path: '/map?filter=food' },
  { id: 'shelter', name: 'Locate Night Shelters', icon: '🏠', path: '/map?filter=shelter' },
  { id: 'restrooms', name: 'Public Restrooms', icon: '🚻', path: '/map?filter=restrooms' },
  { id: 'study', name: 'Discover Study Zones', icon: '📚', path: '/map?filter=study' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name?.split(' ')[0] || 'Citizen';
    if (hour < 12) return `Good Morning, ${name}`;
    if (hour < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>{getGreeting()}</h1>
        <p>Coimbatore's Public Service Hub</p>
      </header>

      <main className="dashboard-main">
        <h2 className="services-title">Available Services</h2>
        <div className="services-list">
          {services.map(service => (
            <div key={service.id} className="service-list-item" onClick={() => navigate(service.path)}>
              <div className="service-list-icon">{service.icon}</div>
              <span className="service-list-name">{service.name}</span>
              <div className="service-list-arrow">›</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="dashboard-footer">
        <button className="footer-btn emergency" onClick={() => window.location.href = 'tel:108'}>
          <span role="img" aria-label="emergency">🚨</span>
          <span>Emergency</span>
        </button>
        <button className="footer-btn map" onClick={() => navigate('/map')}>
          <span role="img" aria-label="map">🗺️</span>
          <span>Explore Map</span>
        </button>
      </footer>
    </div>
  );
}
