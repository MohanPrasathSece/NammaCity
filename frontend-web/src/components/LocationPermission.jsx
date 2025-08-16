import React from 'react';
import './LocationPermission.css';

export default function LocationPermission({ onAllow, onDeny }) {
  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onAllow({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Still call onAllow with null to proceed, but show error
          onAllow(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      onAllow(null);
    }
  };

  return (
    <div className="location-permission-overlay">
      <div className="location-permission-container">
        <div className="location-content">
          {/* App Logo/Icon */}
          <div className="app-icon">
            <div className="icon-circle">
              <span className="city-icon">🏙️</span>
            </div>
          </div>

          {/* Location Illustration */}
          <div className="location-illustration">
            <div className="map-grid">
              <div className="grid-line horizontal line-1"></div>
              <div className="grid-line horizontal line-2"></div>
              <div className="grid-line horizontal line-3"></div>
              <div className="grid-line vertical line-1"></div>
              <div className="grid-line vertical line-2"></div>
              <div className="grid-line vertical line-3"></div>
            </div>
            <div className="location-pin">
              <div className="pin-icon">
                <div className="pin-head"></div>
                <div className="pin-point"></div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="location-text">
            <h1 className="app-title">Namma City</h1>
            <h2 className="permission-title">Enable Location Access</h2>
            <p className="permission-description">
              Namma City needs access to your location to show nearby services and provide personalized recommendations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="location-actions">
            <button 
              className="allow-location-btn" 
              onClick={handleAllowLocation}
            >
              <span className="btn-icon">📍</span>
              ACCESS LOCATION
            </button>
            
            <button 
              className="deny-location-btn" 
              onClick={onDeny}
            >
              Maybe Later
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="privacy-notice">
            <p>
              <span className="privacy-icon">🔒</span>
              Your location data is only used while using the app and is not stored permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
