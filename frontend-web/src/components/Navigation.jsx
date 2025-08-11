import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className="nav-item" activeClassName="active">
        <div className="nav-icon">⌂</div>
        <span className="nav-text">HOME</span>
      </NavLink>
      <NavLink to="/map" className="nav-item" activeClassName="active">
        <div className="nav-icon">🗺</div>
        <span className="nav-text">MAPS</span>
      </NavLink>
      <NavLink to="/bookmarks" className="nav-item" activeClassName="active">
        <div className="nav-icon">★</div>
        <span className="nav-text">SAVED</span>
      </NavLink>
      <NavLink to="/chat" className="nav-item" activeClassName="active">
        <div className="nav-icon">💬</div>
        <span className="nav-text">CHATBOT</span>
      </NavLink>
      <NavLink to="/profile" className="nav-item" activeClassName="active">
        <div className="nav-icon">👤</div>
        <span className="nav-text">PROFILE</span>
      </NavLink>
    </nav>
  );
};

export default Navigation;
