import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
            { id: 1, category: 'food', lat: 11.0274, lng: 76.9716, name: 'Annapoorna Canteen', photoUrl: 'https://images.unsplash.com/photo-1599028422864-a7404a15a539?q=80&w=870', description: 'Hot, nutritious meals for lunch.', timing: '12:00 PM - 2:00 PM', activeDays: 'Mon-Sat', isFree: true },
            { id: 2, category: 'food', lat: 11.0055, lng: 76.9667, name: 'Community Kitchen', photoUrl: 'https://images.unsplash.com/photo-1594705436979-99d01e06b9a3?q=80&w=870', description: 'Evening meals for everyone.', timing: '7:00 PM - 8:30 PM', activeDays: 'All Days', isFree: true },
            { id: 3, category: 'shelter', lat: 11.0182, lng: 76.9615, name: 'Railway Station Night Shelter', photoUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=870', description: 'Safe overnight stay for travelers.', timing: '9:00 PM - 6:00 AM', activeDays: 'All Days', isFree: true },
            { id: 4, category: 'shelter', lat: 10.9950, lng: 76.9450, name: 'Ukkadam Bus Stand Shelter', photoUrl: 'https://images.unsplash.com/photo-1598605272254-16f0c0ecdfa5?q=80&w=871', description: 'Temporary shelter for women and children.', timing: '24 Hours', activeDays: 'All Days', isFree: true },
            { id: 5, category: 'restZone', lat: 11.0040, lng: 76.9600, name: 'VOC Park', photoUrl: 'https://images.unsplash.com/photo-1588235789429-520201ae444d?q=80&w=774', description: 'Peaceful park benches to rest.', timing: '6:00 AM - 8:00 PM', activeDays: 'All Days', isFree: true },
            { id: 6, category: 'restroom', lat: 11.0145, lng: 76.9588, name: 'Town Hall Public Toilet', photoUrl: 'https://images.unsplash.com/photo-1589487391732-71310187a063?q=80&w=870', description: 'Clean and accessible public facilities.', timing: '24 Hours', activeDays: 'All Days', isFree: false },
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
        if (isNavigating && userLocation && destination && routingMachineRef.current) {
            routingMachineRef.current.setWaypoints(userLocation, [destination.lat, destination.lng]);
        }
    }, [userLocation, isNavigating, destination]);

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
        setDestination(loc);
        setSelectedLocation(null);
        setIsNavigating(true);
        setRouteInfo(null);
        setCurrentInstructionIndex(0);
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
        const lastDestination = destination; // Store destination before clearing
        setIsNavigating(false);
        setDestination(null);
        setRouteInfo(null);
        setCurrentInstructionIndex(0);
        // Only re-select the location if it existed
        if (lastDestination) {
            setSelectedLocation(lastDestination);
        }
    };

    if (!userLocation) return <div className="loading-overlay">Detecting your location...</div>;

    return (
        <div className="map-page-container">
            <div className="filter-bar">
                <button onClick={() => handleCategoryClick('all')} className={activeCategory === 'all' ? 'active' : ''}>All</button>
                <button onClick={() => handleCategoryClick('food')} className={activeCategory === 'food' ? 'active' : ''}>🍴 Food</button>
                <button onClick={() => handleCategoryClick('shelter')} className={activeCategory === 'shelter' ? 'active' : ''}>🛌 Stays</button>
                <button onClick={() => handleCategoryClick('restZone')} className={activeCategory === 'restZone' ? 'active' : ''}>🛋️ Zones</button>
                <button onClick={() => handleCategoryClick('restroom')} className={activeCategory === 'restroom' ? 'active' : ''}>🚻 Restrooms</button>
            </div>

            <MapContainer 
                ref={mapRef}
                center={userLocation || [11.0168, 76.9558]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer 
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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

                {isNavigating && destination && (
                    <RoutingMachine ref={routingMachineRef} setInstructions={setRouteInfo} />
                )}
            </MapContainer>

            {isNavigating && (
                <div className="navigation-panel">
                    <div className="navigation-content">
                        {!routeInfo && <p className="instruction-text">Calculating route...</p>}
                        {routeInfo && !currentInstruction && <p className="instruction-text">You have arrived.</p>}
                        {currentInstruction && (
                            <>
                                <p className="instruction-text">{currentInstruction.text}</p>
                                <p className="instruction-distance">in {Math.round(currentInstruction.distance)} meters</p>
                            </>
                        )}
                    </div>
                    <button onClick={handleCancelNavigation} className="cancel-nav-button">Cancel</button>
                </div>
            )}

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
