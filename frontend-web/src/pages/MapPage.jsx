import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import RoutingMachine from '../components/RoutingMachine';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import './MapPage.css';
import '../styles/Page.css';

// --- CUSTOM ICONS ---
const createIcon = (icon, className) => L.divIcon({
    html: `<div class="marker-pin ${className}">${icon}</div>`,
    className: '',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
});

const icons = {
    food: createIcon('🍴', 'food-pin'),
    shelter: createIcon('🛌', 'shelter-pin'),
    restZone: createIcon('🛋️', 'rest-zone-pin'),
    restroom: createIcon('🚻', 'restroom-pin'),
    user: L.divIcon({
        html: `<div class="user-location-marker"></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    }),
};

// --- NAVIGATION PERSISTENCE CONSTANTS ---
const NAVIGATION_STORAGE_KEY = 'urbanaid_navigation_state';
const LOCATION_STORAGE_KEY = 'urbanaid_last_location';
const NAVIGATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- MAP PAGE COMPONENT ---
const MapPage = () => {
    const mapRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [destination, setDestination] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const routingMachineRef = useRef(null);
    const [routingInitiated, setRoutingInitiated] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [allLocations, setAllLocations] = useState([]);
    const [error, setError] = useState(null);
    const navigationTimeoutRef = useRef(null);
    const [mapBearing, setMapBearing] = useState(0);
    const [isFollowingUser, setIsFollowingUser] = useState(false);

    useEffect(() => {
        // Always try to get current precise location first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const currentLocation = { lat: latitude, lng: longitude };
                    
                    // Set the current location and save to cache
                    setUserLocation(currentLocation);
                    saveLastLocation(currentLocation);
                    
                    if (mapRef.current) {
                        mapRef.current.flyTo([latitude, longitude], 15);
                    }
                    console.log('🎯 Got current precise location');
                },
                (error) => {
                    console.error("Error getting current location:", error);
                    
                    // Only use cached location as fallback if GPS fails
                    const cachedLocation = getLastLocation();
                    if (cachedLocation) {
                        console.log('📍 Using cached location as fallback');
                        setUserLocation(cachedLocation);
                        if (mapRef.current) {
                            mapRef.current.flyTo([cachedLocation.lat, cachedLocation.lng], 15);
                        }
                    } else {
                        // Only use default as absolute last resort
                        console.log('⚠️ Using default location as last resort');
                        const defaultLocation = { lat: 11.0168, lng: 76.9558 };
                        setUserLocation(defaultLocation);
                        if (mapRef.current) {
                            mapRef.current.flyTo([defaultLocation.lat, defaultLocation.lng], 15);
                        }
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 } // Longer timeout, shorter cache age
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
            // Use cached location if available
            const cachedLocation = getLastLocation();
            const fallbackLocation = cachedLocation || { lat: 11.0168, lng: 76.9558 };
            setUserLocation(fallbackLocation);
        }
    }, []);

    // --- LOCATION PERSISTENCE FUNCTIONS ---
    const saveLastLocation = (location) => {
        try {
            const locationData = {
                lat: location.lat,
                lng: location.lng,
                timestamp: Date.now()
            };
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
            console.log('📍 Last location saved:', locationData);
        } catch (error) {
            console.error('❌ Failed to save location:', error);
        }
    };

    const getLastLocation = () => {
        try {
            const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
            if (!savedLocation) return null;

            const locationData = JSON.parse(savedLocation);
            // Use cached location if it's less than 24 hours old
            const isRecent = Date.now() - locationData.timestamp < 24 * 60 * 60 * 1000;
            
            if (isRecent) {
                console.log('📍 Using cached location:', locationData);
                return { lat: locationData.lat, lng: locationData.lng };
            } else {
                console.log('⏰ Cached location too old, will use default');
                localStorage.removeItem(LOCATION_STORAGE_KEY);
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to load cached location:', error);
            return null;
        }
    };

    // --- NAVIGATION PERSISTENCE FUNCTIONS ---
    const saveNavigationState = (navState) => {
        try {
            const stateWithTimestamp = {
                ...navState,
                timestamp: Date.now(),
                expiresAt: Date.now() + NAVIGATION_TIMEOUT_MS
            };
            localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
            console.log('💾 Navigation state saved:', stateWithTimestamp);
        } catch (error) {
            console.error('❌ Failed to save navigation state:', error);
        }
    };

    const loadNavigationState = () => {
        try {
            const savedState = localStorage.getItem(NAVIGATION_STORAGE_KEY);
            if (!savedState) return null;

            const parsedState = JSON.parse(savedState);
            const now = Date.now();

            // Check if navigation state has expired
            if (now > parsedState.expiresAt) {
                console.log('⏰ Navigation state expired, clearing...');
                clearNavigationState();
                return null;
            }

            console.log('📱 Navigation state loaded:', parsedState);
            return parsedState;
        } catch (error) {
            console.error('❌ Failed to load navigation state:', error);
            clearNavigationState();
            return null;
        }
    };

    const clearNavigationState = () => {
        try {
            localStorage.removeItem(NAVIGATION_STORAGE_KEY);
            console.log('🗑️ Navigation state cleared');
        } catch (error) {
            console.error('❌ Failed to clear navigation state:', error);
        }
    };

    const updateNavigationTimeout = () => {
        // Clear existing timeout
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
        }

        // Set new timeout for 5 minutes
        navigationTimeoutRef.current = setTimeout(() => {
            console.log('⏰ Navigation timeout reached, clearing state...');
            handleCancelNavigation();
        }, NAVIGATION_TIMEOUT_MS);
    };

    // --- MAP NAVIGATION FUNCTIONS ---
    const calculateBearing = (start, end) => {
        const lat1 = start[0] * Math.PI / 180;
        const lat2 = end[0] * Math.PI / 180;
        const deltaLng = (end[1] - start[1]) * Math.PI / 180;
        
        const y = Math.sin(deltaLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        // Normalize bearing to 0-360 degrees
        bearing = (bearing + 360) % 360;
        return bearing;
    };

    const handleRecenterMap = () => {
        if (!mapRef.current || !userLocation) return;

        setIsFollowingUser(true);

        // Always center on the user's location with a smooth fly-to animation
        mapRef.current.flyTo(userLocation, 16, {
            animate: true,
            duration: 1.5, // A slightly longer duration for a smoother effect
        });

        // Ensure any residual rotation is cleared
        const mapContainer = mapRef.current.getContainer();
        if (mapContainer && mapContainer.style.transform !== 'rotate(0deg)') {
            mapContainer.style.transform = 'rotate(0deg)';
            mapContainer.style.transition = 'transform 0.5s ease-in-out';
        }
    };

    const handleCancelNavigation = () => {
        console.log('🛑 Cancelling navigation...');
        setIsNavigating(false);
        setDestination(null);
        setRouteInfo(null);
        setRoutingInitiated(false);
        
        // Re-center the map on the user's location
        handleRecenterMap();

        // Clear the timeout
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
        }
    };

    // --- RESTORE NAVIGATION STATE ON MOUNT ---
    useEffect(() => {
        const savedNavState = loadNavigationState();
        // Don't restore userLocation from storage, wait for a fresh one.
        if (savedNavState && savedNavState.isNavigating && savedNavState.destination) {
            console.log('🔄 Restoring navigation state...');
            setDestination(savedNavState.destination);
            setIsNavigating(true);
            setRouteInfo(savedNavState.routeInfo);
            setCurrentInstructionIndex(savedNavState.currentInstructionIndex || 0);
            // By not restoring routingInitiated, we force the routing useEffect to re-run with the new location.
            setMapBearing(savedNavState.mapBearing || 0);
            
            // Restore route visualization if we have routing machine
            setTimeout(() => {
                // The main useEffect hook for routing will now handle this, once a fresh userLocation is available.
                // No need to do anything here.
            }, 1000);
            
            // Restart the navigation timeout
            updateNavigationTimeout();
        }
    }, []);

    // --- FETCH DATA (SIMULATED) ---
    useEffect(() => {
        const mockLocations = [
            { id: 1, category: 'food', lat: 11.0274, lng: 76.9716, name: 'Annapoorna Canteen', photoUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', description: 'Hot, nutritious meals for lunch.', timing: '12:00 PM - 2:00 PM', activeDays: 'Mon-Sat', isFree: true },
            { id: 2, category: 'food', lat: 11.0055, lng: 76.9667, name: 'Community Kitchen', photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', description: 'Evening meals for everyone.', timing: '7:00 PM - 8:30 PM', activeDays: 'All Days', isFree: true },
            { id: 3, category: 'shelter', lat: 11.0182, lng: 76.9615, name: 'Railway Station Night Shelter', photoUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop', description: 'Safe overnight stay for travelers.', timing: '9:00 PM - 6:00 AM', activeDays: 'All Days', isFree: true },
            { id: 4, category: 'shelter', lat: 10.9950, lng: 76.9450, name: 'Ukkadam Bus Stand Shelter', photoUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop', description: 'Temporary shelter for women and children.', timing: '24 Hours', activeDays: 'All Days', isFree: true },
            { id: 5, category: 'restZone', lat: 11.0040, lng: 76.9600, name: 'VOC Park', photoUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', description: 'Peaceful park benches to rest.', timing: '6:00 AM - 8:00 PM', activeDays: 'All Days', isFree: true },
            { id: 6, category: 'restroom', lat: 11.0145, lng: 76.9588, name: 'Town Hall Public Toilet', photoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop', description: 'Clean and accessible public facilities.', timing: '24 Hours', activeDays: 'All Days', isFree: false },
        ];
        setAllLocations(mockLocations);
    }, []);

    // --- SAVE NAVIGATION STATE WHENEVER IT CHANGES ---
    useEffect(() => {
        if (isNavigating && destination) {
            const navigationState = {
                isNavigating,
                destination,
                routeInfo,
                currentInstructionIndex,
                routingInitiated,
                userLocation,
                mapBearing
            };
            saveNavigationState(navigationState);
            updateNavigationTimeout(); // Reset the 5-minute timer
        } else if (!isNavigating) {
            // Clear saved state when navigation stops
            clearNavigationState();
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
                navigationTimeoutRef.current = null;
            }
        }
    }, [isNavigating, destination, routeInfo, currentInstructionIndex, routingInitiated, userLocation, mapBearing]);

    // --- AUTO-FOLLOW USER DURING NAVIGATION ---
    useEffect(() => {
        if (isNavigating && userLocation && destination && mapRef.current) {
            // Auto-center map during navigation without re-orienting
            if (isFollowingUser) {
                mapRef.current.setView(userLocation, 18, {
                    animate: true,
                    pan: { duration: 1 }
                });
            }
        }
    }, [userLocation, isNavigating, destination, isFollowingUser]);

    // --- START FOLLOWING USER WHEN NAVIGATION BEGINS ---
    useEffect(() => {
        if (isNavigating && userLocation && destination) {
            setIsFollowingUser(true);
            handleRecenterMap();
        } else {
            setIsFollowingUser(false);
        }
    }, [isNavigating]);

    // --- CLEANUP ON UNMOUNT ---
    useEffect(() => {
        return () => {
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, []);

    const filteredLocations = useMemo(() => {
        // If navigating, only show the destination marker
        if (isNavigating && destination) {
            return allLocations.filter(loc => loc.id === destination.id);
        }

        // Apply category filter to all locations
        if (activeCategory === 'all') {
            return allLocations;
        }
        return allLocations.filter(loc => loc.category === activeCategory);

    }, [allLocations, activeCategory, isNavigating, destination]);

    const currentInstruction = useMemo(() => {
        if (!routeInfo || !routeInfo.instructions || currentInstructionIndex >= routeInfo.instructions.length) {
            return null;
        }
        return routeInfo.instructions[currentInstructionIndex];
    }, [routeInfo, currentInstructionIndex]);

    const nextInstruction = useMemo(() => {
        if (!routeInfo || !routeInfo.instructions || (currentInstructionIndex + 1) >= routeInfo.instructions.length) {
            return null;
        }
        return routeInfo.instructions[currentInstructionIndex + 1];
    }, [routeInfo, currentInstructionIndex]);

    // Auto-advance navigation instructions based on user progress
    useEffect(() => {
        if (!isNavigating || !routeInfo || !routeInfo.instructions || !userLocation) return;

        const instructions = routeInfo.instructions;
        const totalInstructions = instructions.length;
        
        // Simple progression: advance instruction every 30 seconds or based on distance
        const progressInterval = setInterval(() => {
            setCurrentInstructionIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= totalInstructions) {
                    // Reached destination - log only once
                    if (prevIndex < totalInstructions - 1) {
                        console.log('🏁 Navigation complete!');
                    }
                    return totalInstructions - 1; // Stay on last instruction
                }
                console.log(`📍 Advanced to instruction ${nextIndex + 1}/${totalInstructions}`);
                return nextIndex;
            });
        }, 30000); // Advance every 30 seconds

        return () => clearInterval(progressInterval);
    }, [isNavigating, routeInfo, userLocation]);

    // --- GEOLOCATION & NAVIGATION LOGIC ---
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => {
                console.error("Geolocation error:", err);
                setError(`ERROR: ${err.message}`);
                if (!userLocation) setUserLocation({ lat: 11.0168, lng: 76.9558 }); // Default to Coimbatore
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // This effect calls the method on the child component 
    // to update the route when navigation starts (only once per session)
    useEffect(() => {
        // Only trigger routing when navigation starts and routing hasn't been initiated yet
        if (isNavigating && userLocation && destination && !routingInitiated) {
            // Validate that userLocation has valid coordinates
            if (!userLocation.lat || !userLocation.lng || isNaN(userLocation.lat) || isNaN(userLocation.lng)) {
                console.log('⚠️ Invalid user location for routing, waiting for valid coordinates');
                return;
            }
            
            // Validate that destination has valid coordinates
            if (!destination.lat || !destination.lng || isNaN(destination.lat) || isNaN(destination.lng)) {
                console.log('⚠️ Invalid destination coordinates for routing');
                return;
            }
            
            console.log('🚀 Starting navigation routing...');
            setRoutingInitiated(true);
            
            // Small delay to ensure routing machine is ready
            setTimeout(() => {
                if (routingMachineRef.current) {
                    routingMachineRef.current.setWaypoints([userLocation.lat, userLocation.lng], [destination.lat, destination.lng]);
                } else {
                    console.log('⚠️ No routing machine, using fallback route');
                    // Fallback: set route info directly if routing machine isn't ready
                    const distance = L.latLng(userLocation).distanceTo(L.latLng(destination.lat, destination.lng));
                    const fallbackRoute = {
                        name: `Route to ${destination.name}`,
                        instructions: [
                            {
                                type: 'depart',
                                text: `Head towards ${destination.name}`,
                                distance: distance,
                                time: (distance / 1000) * 90,
                                road: 'Direct route',
                                direction: 'straight',
                            }
                        ],
                        summary: {
                            totalDistance: distance,
                            totalTime: (distance / 1000) * 90,
                        }
                    };
                    console.log('📍 Setting fallback route info:', fallbackRoute);
                    setRouteInfo(fallbackRoute);
                }
            }, 100);
        }
    }, [isNavigating, userLocation, destination, routeInfo]);

    useEffect(() => {
        if (isNavigating && userLocation && destination && routeInfo) {
            // Validate userLocation has valid coordinates
            if (!userLocation.lat || !userLocation.lng || isNaN(userLocation.lat) || isNaN(userLocation.lng)) {
                console.log('⚠️ Invalid user location, skipping distance calculation');
                return;
            }
            
            // Validate destination has valid coordinates
            if (!destination.lat || !destination.lng || isNaN(destination.lat) || isNaN(destination.lng)) {
                console.log('⚠️ Invalid destination, skipping distance calculation');
                return;
            }
            
            const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
            const destinationLatLng = L.latLng(destination.lat, destination.lng);
            const distanceToDestination = userLatLng.distanceTo(destinationLatLng);

            // Check if user has arrived at destination (within 50 meters)
            if (distanceToDestination < 50) {
                console.log('🏁 User has arrived at destination!');
                setTimeout(() => {
                    alert(`🎉 You have arrived at ${destination.name}!`);
                    handleCancelNavigation();
                }, 1000);
                return;
            }

            const instructions = routeInfo.instructions;
            if (instructions && currentInstructionIndex < instructions.length) {
                const nextManeuver = instructions[currentInstructionIndex];
                // Ensure latLng is available before creating L.latLng
                if (nextManeuver && nextManeuver.latLng) {
                    const maneuverLatLng = L.latLng(nextManeuver.latLng.lat, nextManeuver.latLng.lng);
                    const distanceToManeuver = userLatLng.distanceTo(maneuverLatLng);

                    // Check if user is close to the next maneuver point (e.g., within 20 meters)
                    if (distanceToManeuver < 20) {
                        setCurrentInstructionIndex(prev => prev + 1);
                    }
                }
            }
        }
    }, [userLocation, isNavigating, destination, routeInfo, currentInstructionIndex]);

    const handleNavigateClick = (loc) => {
        if (!userLocation) return;

        // Calculate bearing and set it once when navigation starts
        const bearing = calculateBearing(userLocation, [loc.lat, loc.lng]);
        setMapBearing(bearing);

        // Rotate the map to face the destination
        const mapContainer = mapRef.current.getContainer();
        if (mapContainer) {
            mapContainer.style.transform = `rotate(${-bearing}deg)`;
            mapContainer.style.transition = 'transform 0.5s ease-in-out';
        }
        console.log('🚀 NAVIGATE CLICKED!', {
            location: loc,
            userLocation,
            isNavigating,
            destination
        });
        
        setSelectedLocation(null); // Hide the detail sheet first
        setDestination(loc);
        setIsNavigating(true);
        setRouteInfo(null);
        setCurrentInstructionIndex(0);
        
        console.log('📍 Navigation state updated:', {
            destination: loc.name,
            isNavigating: true,
            userLocation
        });
        
        // Immediately show route info with turn-by-turn directions
        if (userLocation) {
            const distance = L.latLng(userLocation).distanceTo(L.latLng(loc.lat, loc.lng));
            
            // Calculate direction for turn instructions
            const calculateBearing = (start, end) => {
                const lat1 = start[0] * Math.PI / 180;
                const lat2 = end[0] * Math.PI / 180;
                const deltaLng = (end[1] - start[1]) * Math.PI / 180;
                
                const y = Math.sin(deltaLng) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
                
                return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
            };
            
            const bearing = calculateBearing(userLocation, [loc.lat, loc.lng]);
            const getDirection = (bearing) => {
                if (bearing >= 337.5 || bearing < 22.5) return { text: 'Head North', icon: '⬆️' };
                if (bearing >= 22.5 && bearing < 67.5) return { text: 'Turn Right (Northeast)', icon: '↗️' };
                if (bearing >= 67.5 && bearing < 112.5) return { text: 'Turn Right (East)', icon: '➡️' };
                if (bearing >= 112.5 && bearing < 157.5) return { text: 'Turn Right (Southeast)', icon: '↘️' };
                if (bearing >= 157.5 && bearing < 202.5) return { text: 'Head South', icon: '⬇️' };
                if (bearing >= 202.5 && bearing < 247.5) return { text: 'Turn Left (Southwest)', icon: '↙️' };
                if (bearing >= 247.5 && bearing < 292.5) return { text: 'Turn Left (West)', icon: '⬅️' };
                if (bearing >= 292.5 && bearing < 337.5) return { text: 'Turn Left (Northwest)', icon: '↖️' };
                return { text: 'Head towards destination', icon: '🎯' };
            };
            
            const direction = getDirection(bearing);
            const routeData = {
                name: `Route to ${loc.name}`,
                instructions: [
                    {
                        type: 'depart',
                        text: direction.text,
                        icon: direction.icon,
                        distance: distance * 0.3,
                        time: (distance / 1000) * 30,
                        road: 'Main route',
                        direction: 'turn',
                    },
                    {
                        type: 'continue',
                        text: `Continue straight for ${(distance * 0.4 / 1000).toFixed(1)} km`,
                        icon: '⬆️',
                        distance: distance * 0.4,
                        time: (distance / 1000) * 36,
                        road: 'Main route',
                        direction: 'straight',
                    },
                    {
                        type: 'arrive',
                        text: `Arrive at ${loc.name}`,
                        icon: '🏁',
                        distance: distance * 0.3,
                        time: (distance / 1000) * 24,
                        road: 'Destination',
                        direction: 'arrive',
                    }
                ],
                summary: {
                    totalDistance: distance,
                    totalTime: (distance / 1000) * 90,
                }
            };
            
            console.log('🗺️ Setting detailed route info:', routeData);
            setRouteInfo(routeData);
            
            // Zoom to user location instead of showing both locations
            // Use a longer delay to ensure it happens after RoutingMachine calculations
            setTimeout(() => {
                if (mapRef.current) {
                    // Use flyTo instead of setView for better control
                    mapRef.current.flyTo(userLocation, 14, {
                        animate: true,
                        duration: 1
                    });
                    
                    // Explicitly prevent any rotation by ensuring the map container has no transform
                    setTimeout(() => {
                        const mapContainer = mapRef.current?.getContainer();
                        if (mapContainer) {
                            mapContainer.style.transform = 'rotate(0deg)';
                            mapContainer.style.transition = 'transform 0.3s ease';
                        }
                    }, 100);
                }
            }, 1500); // Wait 1.5 seconds for routing calculations to complete
        } else {
            console.warn('❌ No user location available for navigation');
        }
    };

    const handleAddReviewClick = (id) => alert(`Review form for location ID: ${id}`);

    const handleOpenInGoogleMaps = (lat, lng) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        if (!mapRef.current) return; // Prevent crash if map is not ready

        if (category === 'all') {
            // Show all locations by fitting bounds to include all places
            if (allLocations.length > 0) {
                const bounds = L.latLngBounds(allLocations.map(loc => [loc.lat, loc.lng]));
                mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13 });
            } else if (userLocation) {
                // Fallback to user location if no places available
                mapRef.current.flyTo(userLocation, 12);
            }
            return;
        }
        const categoryLocations = allLocations.filter(loc => loc.category === category);
        if (categoryLocations.length > 0) {
            const bounds = L.latLngBounds(categoryLocations.map(loc => [loc.lat, loc.lng]));
            mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    };



    if (!userLocation) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <h2>{isNavigating ? 'Restoring navigation...' : 'Detecting your location...'}</h2>
                <p>Getting your current GPS position</p>
            </div>
        );
    }

    return (
        <div className="map-page-container">
            <MapContainer 
                ref={mapRef}
                center={userLocation || [11.0168, 76.9558]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer 
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {userLocation && <Marker position={userLocation} icon={icons.user}><Popup>Your current location</Popup></Marker>}

                {filteredLocations.map(loc => (
                    <Marker
                        key={loc.id}
                        position={[loc.lat, loc.lng]} 
                        icon={icons[loc.category]}
                        eventHandlers={{
                            click: () => {
                                setSelectedLocation(loc);
                                if (mapRef.current) {
                                    mapRef.current.flyTo([loc.lat, loc.lng], 14);
                                }
                            },
                        }}
                    />
                ))}

                {isNavigating && destination && (
                    <RoutingMachine ref={routingMachineRef} setInstructions={setRouteInfo} />
                )}
            </MapContainer>

            {/* --- OVERLAYS --- */}

            {/* Hide filter bar during navigation */}
            {!isNavigating && (
                <div className="filter-bar">
                    <button onClick={() => handleCategoryClick('all')} className={activeCategory === 'all' ? 'active' : ''}>All</button>
                    <button onClick={() => handleCategoryClick('food')} className={activeCategory === 'food' ? 'active' : ''}>🍴 Food</button>
                    <button onClick={() => handleCategoryClick('shelter')} className={activeCategory === 'shelter' ? 'active' : ''}>🛌 Stays</button>
                    <button onClick={() => handleCategoryClick('restZone')} className={activeCategory === 'restZone' ? 'active' : ''}>🛋️ Zones</button>
                    <button onClick={() => handleCategoryClick('restroom')} className={activeCategory === 'restroom' ? 'active' : ''}>🚻 Restrooms</button>
                </div>
            )}

            {/* Recenter Button - Always visible */}
            <button
                onClick={handleRecenterMap}
                style={{
                    position: 'fixed',
                    bottom: window.innerWidth < 768 ? '90px' : '100px', // Adjusted for nav bar
                    right: '20px',
                    backgroundColor: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '20px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    transition: 'all 0.2s ease',
                    color: isFollowingUser ? '#FF6700' : '#666'
                }}
                title={isNavigating ? "Recenter and follow navigation" : "Center on my location"}
            >
                🎯
            </button>

            {/* Navigation UI - shows only when navigating */}
            {isNavigating && routeInfo && currentInstruction && (
                <>
                    {/* Top Instruction Card */}
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'calc(100% - 40px)',
                        maxWidth: '350px',
                        backgroundColor: 'rgba(255, 103, 0, 0.9)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        zIndex: 1001,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div style={{ fontSize: '32px', lineHeight: '1' }}>
                            {currentInstruction.direction === 'left' ? '↰' : currentInstruction.direction === 'right' ? '↱' : '⬆️'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentInstruction.text}</div>
                            {nextInstruction && <div style={{ fontSize: '12px', opacity: '0.9' }}>Then: {nextInstruction.text}</div>}
                        </div>
                        <button onClick={handleCancelNavigation} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>&times;</button>
                    </div>

                    {/* Bottom ETA/Distance Card */}
                    <div style={{
                        position: 'fixed',
                        bottom: '80px', // Above nav bar
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        zIndex: 1001,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>{Math.round(routeInfo.summary.totalTime / 60)} min</div>
                        <div style={{ fontSize: '14px', color: '#000' }}>({(routeInfo.summary.totalDistance / 1000).toFixed(1)} km) to {destination.name}</div>
                    </div>
                </>
            )}

            {/* Location Detail Sheet - shows only when a location is selected AND we are NOT navigating */}
            {selectedLocation && !isNavigating && (
                <div className="location-detail-sheet">
                    <button className="close-sheet-button" onClick={() => setSelectedLocation(null)}>&times;</button>
                    <div className="sheet-content">
                        <img src={selectedLocation.photoUrl} alt={selectedLocation.name} className="sheet-photo" />
                        <div className="sheet-header">
                            <h3>{selectedLocation.name}</h3>
                            <div className="header-tags-row">
                                {selectedLocation.isFree && <button className="header-tag tag-free" disabled>Free</button>}
                                <button className="header-tag tag-distance" disabled>{userLocation ? `${(L.latLng(userLocation).distanceTo(L.latLng(selectedLocation.lat, selectedLocation.lng)) / 1000).toFixed(1)} km` : ''}</button>
                                <button 
                                    className="header-tag tag-gmaps"
                                    onClick={() => handleOpenInGoogleMaps(selectedLocation.lat, selectedLocation.lng)}
                                    title="Open in Google Maps"
                                >
                                    🗺️ Google Maps
                                </button>
                            </div>
                        </div>
                        <p className="sheet-description">{selectedLocation.description}</p>
                        <div className="sheet-info">
    <p><strong>Timings:</strong> {selectedLocation.timing || 'Not available'}</p>
    <p><strong>Open:</strong> {selectedLocation.activeDays || 'Not available'}</p>
</div>
                        {/* The empty box was here and has been removed */}
                        <div className="sheet-actions-row">
                            <button className="nav-button" onClick={() => handleNavigateClick(selectedLocation)}>Navigate &rarr;</button>
                            <button className="review-button" onClick={() => handleAddReviewClick(selectedLocation.id)}>Add Review</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;
