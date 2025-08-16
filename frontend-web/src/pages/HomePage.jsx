import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Weather from '../components/Weather'; // Import the new Weather component
import Chatbot from '../components/Chatbot'; // Import the Chatbot component
import './HomePage.css';

const services = [
  { id: 'food', name: 'Find Free Food', icon: '🍔', path: '/map?category=food' },
  { id: 'shelter', name: 'Locate Night Shelters', icon: '🏠', path: '/map?category=shelter' },
  { id: 'restZone', name: 'Rest Zones', icon: '🛋️', path: '/map?category=restZone' },
  { id: 'restroom', name: 'Public Restrooms', icon: '🚻', path: '/map?category=restroom' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getWelcomeMessage = () => {
    const name = user?.name?.split(' ')[0] || 'Citizen';
    return `Welcome, ${name}`;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="app-title">Namma City</h1>
          <p className="welcome-text">{getWelcomeMessage()}</p>
        </div>
      </header>

      <main className="dashboard-main">
        <Weather />
        <h2 className="services-title">Available Services</h2>
        <div className="services-list">
          {services.map(service => (
            <div 
              key={service.id} 
              className="service-list-item" 
              onClick={() => {
                // Navigate to map with the category filter
                navigate(service.path);
              }}
            >
              <div className="service-list-icon">{service.icon}</div>
              <span className="service-list-name">{service.name}</span>
              <div className="service-list-arrow">›</div>
            </div>
          ))}
        </div>
      </main>

      
      {isChatOpen ? (
        <Chatbot closeChat={() => setIsChatOpen(false)} />
      ) : (
        <div className="fab-chat-container">
          <span className="chat-tooltip">AI Assistant</span>
          <button className="fab-chat" onClick={() => setIsChatOpen(true)}>
            <span role="img" aria-label="AI Assistant">🤖</span>
          </button>
        </div>
      )}
    </div>
  );
}
