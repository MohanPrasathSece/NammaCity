import React from 'react';
import './LocationLoader.css';

const LocationLoader = () => {
  return (
    <div className="location-loader-overlay">
      <div className="location-loader-content">
        <div className="loader-spinner"></div>
        <h2 className="loader-title">Finding your location...</h2>
        <p className="loader-subtitle">Please wait while we pinpoint your position for the best experience.</p>
      </div>
    </div>
  );
};

export default LocationLoader;
