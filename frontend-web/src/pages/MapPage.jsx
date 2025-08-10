import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// --- ROUTING COMPONENT ---
const RoutingMachine = ({ start, end, setInstructions }) => {
    const map = useMap();
    const routingControlRef = React.useRef(null);

    useEffect(() => {
        if (!map) return;

        if (!routingControlRef.current) {
            const instance = L.Routing.control({
                waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
                routeWhileDragging: false, // Disable to prevent conflicts with live tracking
                router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
                show: false,
                addWaypoints: false,
                lineOptions: { styles: [{ color: '#FF6700', opacity: 0.9, weight: 7 }] },
                createMarker: () => null,
            }).addTo(map);
            instance.on('routesfound', (e) => e.routes.length > 0 && setInstructions(e.routes[0]));
            routingControlRef.current = instance;
        }

        return () => {
            if (routingControlRef.current) {
                map.removeControl(routingControlRef.current);
                routingControlRef.current = null;
            }
        };
    }, [map]);

    useEffect(() => {
        if (routingControlRef.current) {
            routingControlRef.current.setWaypoints([L.latLng(start[0], start[1]), L.latLng(end[0], end[1])]);
        }
    }, [start, end]);

    return null;
};

// --- MAP PAGE COMPONENT ---
const MapPage = () => {
    const [userLocation, setUserLocation] = useState(null);
        const [selectedLocation, setSelectedLocation] = useState(null);
    const [destination, setDestination] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
    const mapRef = React.useRef(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [allLocations, setAllLocations] = useState([]);
    const [error, setError] = useState(null);

    // --- FETCH DATA (SIMULATED) ---
    useEffect(() => {
        const mockLocations = [
            // Food
            { id: 1, category: 'food', lat: 11.0274, lng: 76.9716, name: 'Annapoorna Canteen', photoUrl: 'https://images.unsplash.com/photo-1599028422864-a7404a15a539?q=80&w=870', description: 'Hot, nutritious meals for lunch.', timing: '12:00 PM - 2:00 PM', activeDays: 'Mon-Sat', isFree: true },
            { id: 2, category: 'food', lat: 11.0055, lng: 76.9667, name: 'Community Kitchen', photoUrl: 'https://images.unsplash.com/photo-1565555178269-b7033ba38363?q=80&w=874', description: 'Evening meals for everyone.', timing: '7:00 PM - 8:30 PM', activeDays: 'All Days', isFree: true },
            // Shelters
            { id: 3, category: 'shelter', lat: 11.0182, lng: 76.9615, name: 'Railway Station Night Shelter', photoUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=870', description: 'Safe overnight stay for travelers.', timing: '9:00 PM - 6:00 AM', activeDays: 'All Days', isFree: true },
            { id: 4, category: 'shelter', lat: 10.9950, lng: 76.9450, name: 'Ukkadam Bus Stand Shelter', photoUrl: 'https://images.unsplash.com/photo-1598605272254-16f0c0ecdfa5?q=80&w=871', description: 'Temporary shelter for women and children.', timing: '24 Hours', activeDays: 'All Days', isFree: true },
            // Rest Zones
            { id: 5, category: 'restZone', lat: 11.0040, lng: 76.9600, name: 'VOC Park', photoUrl: 'https://images.unsplash.com/photo-1588235789429-520201ae444d?q=80&w=774', description: 'Peaceful park benches to rest.', timing: '6:00 AM - 8:00 PM', activeDays: 'All Days', isFree: true },
            // Restrooms
            { id: 6, category: 'restroom', lat: 11.0145, lng: 76.9588, name: 'Town Hall Public Toilet', photoUrl: 'https://images.unsplash.com/photo-1589487391732-71310187a063?q=80&w=870', description: 'Clean and accessible public facilities.', timing: '24 Hours', activeDays: 'All Days', isFree: false },
        ];
        setAllLocations(mockLocations);
    }, []);

    const filteredLocations = useMemo(() =>
        activeCategory === 'all' ? allLocations : allLocations.filter(loc => loc.category === activeCategory),
        [activeCategory, allLocations]
    );

    // --- GEOLOCATION ---
    useEffect(() => {
                // Center map on user during navigation
                if (destination && routeInfo && mapRef.current) {
            mapRef.current.panTo(userLocation);

            const nextManeuver = routeInfo.instructions[currentInstructionIndex];
            if (nextManeuver) {
                const userLatLng = L.latLng(userLocation);
                const maneuverLatLng = L.latLng(nextManeuver.latLng.lat, nextManeuver.latLng.lng);
                const distanceToManeuver = userLatLng.distanceTo(maneuverLatLng);

                if (distanceToManeuver < 20) { // 20 meters threshold
                    setCurrentInstructionIndex(prev => prev + 1);
                }
            }
        }

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

        const handleNavigateClick = (loc) => {
        setDestination(loc);
        setSelectedLocation(null); // Close the popup
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
        const handleExitNavigation = () => {
        setSelectedLocation(destination); // Re-open the popup
        setDestination(null);
        setRouteInfo(null);
        setCurrentInstructionIndex(0);
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

            <MapContainer ref={mapRef} center={userLocation} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {userLocation && <Marker position={userLocation} icon={icons.user}><Popup>Your current location</Popup></Marker>}

                                {filteredLocations.map(loc => (
                    <Marker 
                        key={loc.id} 
                        position={[loc.lat, loc.lng]} 
                        icon={icons[loc.category]}
                        eventHandlers={{
                            click: () => {
                                setSelectedLocation(loc);
                            },
                        }}>
                                                {selectedLocation && selectedLocation.id === loc.id && (
                            <Popup className="food-popup" onClose={() => setSelectedLocation(null)}>
                                <div className="popup-content">
                                    <img src={loc.photoUrl} alt={loc.name} className="popup-photo" />
                                    <div className="popup-header"><h3>{loc.name}</h3><span className={`price-tag ${loc.isFree ? 'free' : 'paid'}`}>{loc.isFree ? 'Free' : 'Paid'}</span></div>
                                    <p className="popup-description">{loc.description}</p>
                                    <div className="popup-info"><p><strong>Timings:</strong> {loc.timing}</p><p><strong>Open:</strong> {loc.activeDays}</p></div>
                                    <div className="popup-actions">
                                        <button className="nav-button" onClick={() => handleNavigateClick(loc)}>Start</button>
                                                                                <button className="review-button" onClick={() => handleAddReviewClick(loc.id)}>Add Review</button>
                                        <button className="google-maps-button" onClick={() => handleOpenInGoogleMaps(loc.lat, loc.lng)}>View on Google Maps</button>
                                    </div>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}

                                {userLocation && destination && <RoutingMachine start={userLocation} end={[destination.lat, destination.lng]} setInstructions={setRouteInfo} />}
            </MapContainer>

                        {destination && routeInfo && (
                <div className="turn-by-turn-panel">
                    <div className="panel-header">
                        <h3>{destination.name}</h3>
                        <button className="exit-nav-button" onClick={handleExitNavigation}>&times;</button>
                    </div>
                    <div className="turn-by-turn-content">
                        {currentInstructionIndex < routeInfo.instructions.length ? (
                            <p className="current-instruction">{routeInfo.instructions[currentInstructionIndex].text}</p>
                        ) : (
                            <p className="current-instruction">You have arrived at your destination.</p>
                        )}
                    </div>
                    <div className="route-summary">
                        <p><strong>Distance:</strong> {(routeInfo.summary.totalDistance / 1000).toFixed(2)} km</p>
                        <p><strong>Time:</strong> {Math.round(routeInfo.summary.totalTime / 60)} min</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;
