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
    const [activeCategory, setActiveCategory] = useState('all');
    const [allLocations, setAllLocations] = useState([]);
    const [error, setError] = useState(null);

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

    const filteredLocations = useMemo(() => {
        if (isNavigating && destination) {
            return allLocations.filter(loc => loc.id === destination.id);
        }
        return activeCategory === 'all' ? allLocations : allLocations.filter(loc => loc.category === activeCategory);
    }, [activeCategory, allLocations, isNavigating, destination]);

    const currentInstruction = useMemo(() => {
        if (!routeInfo || !routeInfo.instructions || currentInstructionIndex >= routeInfo.instructions.length) {
            return null;
        }
        return routeInfo.instructions[currentInstructionIndex];
    }, [routeInfo, currentInstructionIndex]);

    // --- GEOLOCATION & NAVIGATION LOGIC ---
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => {
                console.error("Geolocation error:", err);
                setError(`ERROR: ${err.message}`);
                if (!userLocation) setUserLocation([11.0168, 76.9558]); // Default to Coimbatore
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // This effect calls the method on the child component 
    // to update the route when the user's location changes.
    useEffect(() => {
        console.log('🔄 Routing useEffect triggered:', {
            isNavigating,
            hasUserLocation: !!userLocation,
            hasDestination: !!destination,
            hasRouteInfo: !!routeInfo,
            shouldTriggerRouting: isNavigating && userLocation && destination && !routeInfo
        });
        
        // Trigger routing when navigation starts
        if (isNavigating && userLocation && destination && !routeInfo) {
            console.log('🚀 Starting routing process...');
            
            // Small delay to ensure routing machine is ready
            setTimeout(() => {
                console.log('⏰ Routing timeout triggered, checking routing machine:', {
                    hasRoutingMachine: !!routingMachineRef.current
                });
                
                if (routingMachineRef.current) {
                    console.log('🗺️ Using routing machine for waypoints');
                    routingMachineRef.current.setWaypoints(userLocation, [destination.lat, destination.lng]);
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
            const instructions = routeInfo.instructions;
            if (instructions && currentInstructionIndex < instructions.length) {
                const nextManeuver = instructions[currentInstructionIndex];
                // Ensure latLng is available before creating L.latLng
                if (nextManeuver && nextManeuver.latLng) {
                    const userLatLng = L.latLng(userLocation[0], userLocation[1]);
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
            
            // Auto-zoom to show both locations
            if (mapRef.current) {
                const bounds = L.latLngBounds([userLocation, [loc.lat, loc.lng]]);
                mapRef.current.fitBounds(bounds, { 
                    padding: [50, 50],
                    maxZoom: 15
                });
            }
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
            if (userLocation) mapRef.current.flyTo(userLocation, 15);
            return;
        }
        const categoryLocations = allLocations.filter(loc => loc.category === category);
        if (categoryLocations.length > 0) {
            const bounds = L.latLngBounds(categoryLocations.map(loc => [loc.lat, loc.lng]));
            mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    };

    const handleCancelNavigation = () => {
        console.log('🔙 Canceling navigation, returning to location popup');
        const lastDestination = destination; // Store destination before clearing
        setIsNavigating(false);
        setDestination(null);
        setRouteInfo(null);
        setCurrentInstructionIndex(0);
        // Always re-select the location to show the popup again
        if (lastDestination) {
            setSelectedLocation(lastDestination);
        }
    };

    if (!userLocation) return <div className="loading-overlay">Detecting your location...</div>;

    return (
        <div className="map-page-container">
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

            <MapContainer 
                ref={mapRef}
                center={userLocation || [11.0168, 76.9558]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
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
                                    mapRef.current.flyTo([loc.lat, loc.lng], 16);
                                }
                            },
                        }}
                    />
                ))}

                {/* Route line visualization */}
                {isNavigating && destination && userLocation && (
                    <Polyline
                        positions={[userLocation, [destination.lat, destination.lng]]}
                        color="#FF6700"
                        weight={6}
                        opacity={0.8}
                        dashArray="10, 5"
                    />
                )}

                {isNavigating && destination && (
                    <RoutingMachine ref={routingMachineRef} setInstructions={setRouteInfo} />
                )}
            </MapContainer>

            {/* Navigation Panel - shows only when navigating */}
            {(() => {
                console.log('🔍 Navigation Panel Check:', {
                    isNavigating,
                    destination: destination?.name,
                    routeInfo: routeInfo?.name,
                    currentInstruction: currentInstruction?.text,
                    shouldShow: isNavigating && destination
                });
                
                if (isNavigating && destination) {
                    console.log('✅ Navigation panel should be visible!');
                    
                    // Check if mobile (screen width < 768px)
                    const isMobile = window.innerWidth < 768;
                    
                    return (
                        <div className="navigation-panel" style={{
                            position: 'fixed',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            height: '30vh', // Increased to 30% of screen height
                            backgroundColor: 'white',
                            color: '#333',
                            padding: '20px',
                            borderTopLeftRadius: '20px',
                            borderTopRightRadius: '20px',
                            boxShadow: '0 -6px 25px rgba(0, 0, 0, 0.15)',
                            zIndex: 1000,
                            borderBottom: 'none'
                        }}>
                            {/* Exit Button */}
                            <button 
                                onClick={handleCancelNavigation}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    backgroundColor: '#f5f5f5',
                                    border: '1px solid #ddd',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            >
                                ✕
                            </button>

                            <div className="navigation-content">
                                {/* Enhanced navigation info with bigger fonts and orange colors */}
                                <div style={{ paddingRight: '50px', paddingTop: '10px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700', color: '#FF6700' }}>
                                        🧭 {destination.name}
                                    </h4>
                                    {userLocation && routeInfo && (
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '24px', 
                                            fontSize: '18px', 
                                            color: '#FF6700',
                                            marginTop: '20px'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                backgroundColor: '#FFF3E6',
                                                padding: '12px 16px',
                                                borderRadius: '25px',
                                                border: '2px solid #FFE0CC'
                                            }}>
                                                <span style={{ fontSize: '20px' }}>📏</span>
                                                <span style={{ fontWeight: '700', fontSize: '18px' }}>
                                                    {(routeInfo.summary.totalDistance / 1000).toFixed(1)} km
                                                </span>
                                            </div>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                backgroundColor: '#FFF3E6',
                                                padding: '12px 16px',
                                                borderRadius: '25px',
                                                border: '2px solid #FFE0CC'
                                            }}>
                                                <span style={{ fontSize: '20px' }}>⏱️</span>
                                                <span style={{ fontWeight: '700', fontSize: '18px' }}>
                                                    {Math.round(routeInfo.summary.totalTime / 60)} min
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                } else {
                    console.log('❌ Navigation panel hidden:', { isNavigating, hasDestination: !!destination });
                    return null;
                }
            })()}

            {/* Location Detail Sheet - shows only when a location is selected AND we are NOT navigating */}
            {selectedLocation && !isNavigating && (
                <div className="location-detail-sheet">
                    <button className="close-sheet-button" onClick={() => setSelectedLocation(null)}>&times;</button>
                    <div className="sheet-content">
                        <img src={selectedLocation.photoUrl} alt={selectedLocation.name} className="sheet-photo" />
                        <div className="sheet-header">
                            <h3>{selectedLocation.name}</h3>
                            <div className="header-tags">
                                {selectedLocation.isFree && <span className="free-badge">Free</span>}
                                {(() => {
                                    const distance = userLocation ? (L.latLng(userLocation).distanceTo(L.latLng(selectedLocation.lat, selectedLocation.lng)) / 1000).toFixed(1) : null;
                                    return distance && <span className="distance-tag">{distance} km away</span>;
                                })()}
                            </div>
                        </div>
                        <p className="sheet-description">{selectedLocation.description}</p>
                        <div className="sheet-info"><p><strong>Timings:</strong> {selectedLocation.timing}</p><p><strong>Open:</strong> {selectedLocation.activeDays}</p></div>
                        <div className="sheet-actions">
                            <button className="nav-button" onClick={() => handleNavigateClick(selectedLocation)}>Navigate &rarr;</button>
                            <button className="review-button" onClick={() => handleAddReviewClick(selectedLocation.id)}>Add Review</button>
                            <button className="google-maps-button" onClick={() => handleOpenInGoogleMaps(selectedLocation.lat, selectedLocation.lng)}>View on Google Maps</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;
