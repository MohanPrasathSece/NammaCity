import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      path: '/home',
      color: '#FF6B6B'
    },
    {
      id: 'map',
      label: 'Maps',
      icon: '🗺️',
      path: '/map',
      color: '#FF6700'
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: '📝',
      path: '/journal',
      color: '#4ECDC4'
    },
    {
      id: 'bookmarks',
      label: 'Saved',
      icon: '⭐',
      path: '/bookmarks',
      color: '#FFD93D'
    },
    {
      id: 'chat',
      label: 'Chatbot',
      icon: '🤖',
      path: '/chat',
      color: '#45B7D1'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/profile',
      color: '#96CEB4'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className="bottom-navigation">
      <div className="nav-container">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              style={{
                '--accent-color': item.color
              }}
            >
              <div className="nav-icon">
                {item.icon}
              </div>
              
              <span className="nav-label">
                {item.label}
              </span>
              
              {isActive && (
                <div className="nav-indicator" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
