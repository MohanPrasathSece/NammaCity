import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './MapPage.css';

const COIMBATORE_CENTER = [11.0168, 76.9558]; // [lat, lng]

const MapPage = () => {
  const [markers, setMarkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState(new Set(['all']));
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState('prompt');

  // Sample food places for demo (will be replaced by API data)
  const sampleMarkers = [
    {
      id: '1',
      name: 'Annapoorna Workers Mess',
      description: 'Full South Indian meals for ₹25. Free unlimited rice, sambar, rasam.',
      category: 'Meals',
      coordinates: [76.9558, 11.0168],
      address: 'RS Puram Main Road, Near Bus Stand',
      phone: '+91 422 2544321',
      priceRange: '₹',
      specialOffers: 'Free buttermilk with every meal. 10% discount for delivery partners.'
    },
    {
      id: '2',
      name: 'Ganga Free Food Center',
      description: 'FREE lunch for job seekers and daily wage workers. Served 12-2 PM.',
      category: 'Free Food',
      coordinates: [76.9558, 11.0168],
      address: 'Saibaba Colony, Near Ganga Hospital',
      phone: '+91 422 2678901',
      priceRange: 'FREE',
      specialOffers: 'Completely FREE lunch for anyone in need. Rice, dal, vegetable, pickle.'
    },
    {
      id: '3',
      name: 'Workers Tea Stall',
      description: 'Tea ₹5, Coffee ₹8, Biscuits ₹2. Popular spot for auto drivers.',
      category: 'Tea & Snacks',
      coordinates: [76.9558, 11.0168],
      address: 'Oppanakara Street, Town Hall',
      phone: '+91 422 2334455',
      priceRange: '₹',
      specialOffers: 'Buy 10 teas, get 1 free. Credit available for regular customers.'
    }
  ];

  const categoryMap = {
    'Meals': { emoji: '🍽️', color: '#FF6700' },
    'Tiffin': { emoji: '🥞', color: '#E74C3C' },
    'Free Food': { emoji: '🆓', color: '#27AE60' },
    'Tea & Snacks': { emoji: '☕', color: '#F39C12' },
    'Government Canteen': { emoji: '🏛️', color: '#3498DB' },
    'Street Food': { emoji: '🌮', color: '#9B59B6' }
  };

  useEffect(() => {
    loadData();
    requestUserLocation();
  }, []);

  const loadData = async () => {
    try {
      // For demo, use sample data
      setMarkers(sampleMarkers);
      
      // Create categories from sample data
      const cats = [
        { id: 'all', name: 'All', emoji: '🍴', color: '#FF6700' },
        ...Object.keys(categoryMap).map(cat => ({
          id: cat.toLowerCase().replace(/\s+/g, '-'),
          name: cat,
          emoji: categoryMap[cat].emoji,
          color: categoryMap[cat].color
        }))
      ];
      setCategories(cats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermission('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = [position.coords.latitude, position.coords.longitude];
        setUserLocation(userPos);
        setLocationPermission('granted');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPermission('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const toggleCategory = (categoryId) => {
    const newActiveCategories = new Set(activeCategories);
    
    if (categoryId === 'all') {
      if (newActiveCategories.has('all')) {
        newActiveCategories.clear();
      } else {
        newActiveCategories.clear();
        newActiveCategories.add('all');
      }
    } else {
      newActiveCategories.delete('all');
      if (newActiveCategories.has(categoryId)) {
        newActiveCategories.delete(categoryId);
      } else {
        newActiveCategories.add(categoryId);
      }
    }

    setActiveCategories(newActiveCategories);
  };

  const filteredMarkers = markers.filter(marker => {
    if (activeCategories.has('all')) return true;
    return activeCategories.has(marker.category.toLowerCase().replace(/\s+/g, '-'));
  });

  const navigateToPlace = (marker) => {
    if (userLocation) {
      const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${marker.coordinates[1]},${marker.coordinates[0]}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${marker.coordinates[1]},${marker.coordinates[0]}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const centerOnUser = () => {
    if (!userLocation) {
      requestUserLocation();
    }
    // In a real map implementation, this would center the map on user location
    alert(userLocation ? 'Centering on your location...' : 'Requesting location access...');
  };

  return (
    <div className="map-page">
      {loading && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading food places...</p>
        </div>
      )}

      {/* Cartoon-style Map Container */}
      <div className="map-container">
        <div className="cartoon-map">
          <div className="map-background">
            {/* Cartoon-style map elements */}
            <div className="map-roads"></div>
            <div className="map-buildings"></div>
            <div className="map-parks"></div>
            
            {/* User location marker */}
            {userLocation && (
              <div className="user-marker" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                <div className="user-marker-content">
                  <div className="user-marker-dot"></div>
                  <div className="user-marker-pulse"></div>
                </div>
              </div>
            )}

            {/* Food place markers */}
            {filteredMarkers.map((marker, index) => {
              const categoryInfo = categoryMap[marker.category] || { emoji: '🍴', color: '#FF6700' };
              return (
                <div
                  key={marker.id}
                  className="custom-marker"
                  style={{
                    position: 'absolute',
                    top: `${30 + index * 15}%`,
                    left: `${40 + index * 10}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => setSelectedMarker(marker)}
                >
                  <div className="marker-content" style={{ backgroundColor: categoryInfo.color }}>
                    <span className="marker-emoji">{categoryInfo.emoji}</span>
                  </div>
                  <div className="marker-pulse" style={{ borderColor: categoryInfo.color }}></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-scroll">
          {categories.map(category => (
            <button
              key={category.id}
              className={`filter-pill ${activeCategories.has(category.id) ? 'active' : ''}`}
              onClick={() => toggleCategory(category.id)}
              style={{
                backgroundColor: activeCategories.has(category.id) ? category.color : 'transparent',
                borderColor: category.color
              }}
            >
              <span className="filter-emoji">{category.emoji}</span>
              <span className="filter-name">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Locate Me Button */}
      <button className="locate-btn" onClick={centerOnUser}>
        <span className="locate-icon">📍</span>
      </button>

      {/* Info Card */}
      {selectedMarker && (
        <div className="info-card">
          <div className="info-card-content">
            <button 
              className="info-close"
              onClick={() => setSelectedMarker(null)}
            >
              ×
            </button>
            
            <div className="info-header">
              <h3>{selectedMarker.name}</h3>
              <span className="info-price">{selectedMarker.priceRange}</span>
            </div>
            
            <p className="info-description">{selectedMarker.description}</p>
            
            <div className="info-details">
              <div className="info-address">
                <span className="info-icon">📍</span>
                <span>{selectedMarker.address}</span>
              </div>
              
              {selectedMarker.phone && (
                <div className="info-phone">
                  <span className="info-icon">📞</span>
                  <span>{selectedMarker.phone}</span>
                </div>
              )}
            </div>
            
            {selectedMarker.specialOffers && (
              <div className="info-offer">
                <span className="offer-tag">Special Offer</span>
                <p>{selectedMarker.specialOffers}</p>
              </div>
            )}
            
            <button 
              className="navigate-btn"
              onClick={() => navigateToPlace(selectedMarker)}
            >
              <span>🧭</span>
              Navigate
            </button>
          </div>
        </div>
      )}

      {/* Location Permission Prompt */}
      {locationPermission === 'denied' && (
        <div className="location-prompt">
          <div className="prompt-content">
            <span className="prompt-icon">📍</span>
            <p>Enable location to find food places near you</p>
            <button onClick={requestUserLocation}>Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
