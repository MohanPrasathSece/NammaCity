import React, { createContext, useState, useContext, useEffect } from 'react';

const LocationContext = createContext();
export const useLocation = () => useContext(LocationContext);

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Check if we have cached location on app start
  useEffect(() => {
    const cachedLocation = localStorage.getItem('namma-city-location');
    const locationTimestamp = localStorage.getItem('namma-city-location-timestamp');
    
    if (cachedLocation && locationTimestamp) {
      const now = Date.now();
      const cached = parseInt(locationTimestamp);
      // Use cached location if it's less than 24 hours old
      if (now - cached < 24 * 60 * 60 * 1000) {
        setUserLocation(JSON.parse(cachedLocation));
        setLocationPermission('granted');
        return;
      }
    }

    // Check browser permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        if (result.state === 'prompt') {
          setShowLocationPermission(true);
        } else if (result.state === 'granted') {
          getCurrentLocation();
        }
      });
    } else {
      // Fallback for browsers that don't support permissions API
      setShowLocationPermission(true);
    }
  }, []);

  const getCurrentLocation = () => {
    setIsLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setUserLocation(location);
          setLocationPermission('granted');
          setShowLocationPermission(false);
          setIsLocationLoading(false);
          
          // Cache the location
          localStorage.setItem('namma-city-location', JSON.stringify(location));
          localStorage.setItem('namma-city-location-timestamp', Date.now().toString());
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission('denied');
          setShowLocationPermission(false);
          setIsLocationLoading(false);
          
          // Use default location (Coimbatore) if permission denied
          const defaultLocation = { lat: 11.0168, lng: 76.9558 };
          setUserLocation(defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      console.error('Geolocation is not supported');
      setLocationPermission('denied');
      setShowLocationPermission(false);
      setIsLocationLoading(false);
      
      // Use default location
      const defaultLocation = { lat: 11.0168, lng: 76.9558 };
      setUserLocation(defaultLocation);
    }
  };

  const requestLocationPermission = () => {
    setShowLocationPermission(true);
  };

  const handleLocationAllow = (location) => {
    if (location) {
      setUserLocation(location);
      setLocationPermission('granted');
      
      // Cache the location
      localStorage.setItem('namma-city-location', JSON.stringify(location));
      localStorage.setItem('namma-city-location-timestamp', Date.now().toString());
    } else {
      // Use default location if geolocation failed
      const defaultLocation = { lat: 11.0168, lng: 76.9558 };
      setUserLocation(defaultLocation);
      setLocationPermission('denied');
    }
    setShowLocationPermission(false);
  };

  const handleLocationDeny = () => {
    setLocationPermission('denied');
    setShowLocationPermission(false);
    
    // Use default location (Coimbatore)
    const defaultLocation = { lat: 11.0168, lng: 76.9558 };
    setUserLocation(defaultLocation);
  };

  const value = {
    userLocation,
    locationPermission,
    showLocationPermission,
    isLocationLoading,
    getCurrentLocation,
    requestLocationPermission,
    handleLocationAllow,
    handleLocationDeny
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}
