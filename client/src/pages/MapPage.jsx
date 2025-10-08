import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import RoutingMachine from '../components/RoutingMachine';
import LocationLoader from '../components/LocationLoader';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import './MapPage.css';
import '../styles/Page.css';
import { issueAPI, safetyAPI, accessibilityAPI } from '../services/api';

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
    // Civic issues icons (distinct emoji + class for styling if needed)
    issue_pothole: createIcon('🕳️', 'issue-pin pothole'),
    issue_garbage: createIcon('🗑️', 'issue-pin garbage'),
    issue_street_light: createIcon('💡', 'issue-pin street-light'),
    issue_water_logging: createIcon('💧', 'issue-pin water-logging'),
    issue_other: createIcon('⚠️', 'issue-pin other'),
    // Safety alerts icons
    safety_dark_street: createIcon('🌃', 'safety-pin dark-street'),
    safety_harassment_spot: createIcon('🚫', 'safety-pin harassment'),
    safety_theft_risk: createIcon('🧰', 'safety-pin theft'),
    safety_animal_threat: createIcon('🐕', 'safety-pin animal'),
    safety_other: createIcon('⚠️', 'safety-pin other'),
    // Accessibility icons
    acc_construction: createIcon('🚧', 'acc-pin construction'),
    acc_roadblock: createIcon('⛔', 'acc-pin roadblock'),
    acc_elevator_outage: createIcon('🛑', 'acc-pin elevator'),
    acc_ramp_blocked: createIcon('🛗', 'acc-pin ramp'),
    acc_other: createIcon('♿', 'acc-pin other'),
};

// --- NAVIGATION PERSISTENCE CONSTANTS ---
const NAVIGATION_STORAGE_KEY = 'urbanaid_navigation_state';
const LOCATION_STORAGE_KEY = 'urbanaid_last_location';
const NAVIGATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- MAP PAGE COMPONENT ---
const MapPage = () => {
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category');
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
    const mapKey = useRef(Date.now()); // Use ref for unique key

    // --- CIVIC ISSUES STATE ---
    const [showIssues, setShowIssues] = useState(false);
    const [issues, setIssues] = useState([]);
    const [issueLoading, setIssueLoading] = useState(false);
    const [issueError, setIssueError] = useState('');
    const [issueFilters, setIssueFilters] = useState({
        status: { reported: true, verified: true, resolved: false },
        types: { pothole: true, garbage: true, 'street-light': true, 'water-logging': true, other: true },
    });

    // --- SAFETY ALERTS STATE ---
    const [showSafety, setShowSafety] = useState(false);
    const [safetyAlerts, setSafetyAlerts] = useState([]);
    const [safetyLoading, setSafetyLoading] = useState(false);
    const [safetyError, setSafetyError] = useState('');
    const [safetyFilters, setSafetyFilters] = useState({
        status: { active: true, resolved: false },
        types: { dark_street: true, harassment_spot: true, theft_risk: true, animal_threat: true, other: true },
    });

    // --- ACCESSIBILITY STATE ---
    const [showAccessibility, setShowAccessibility] = useState(false);
    const [accReports, setAccReports] = useState([]);
    const [accLoading, setAccLoading] = useState(false);
    const [accError, setAccError] = useState('');
    const [accFilters, setAccFilters] = useState({
        status: { active: true, resolved: false },
        types: { construction: true, roadblock: true, elevator_outage: true, ramp_blocked: true, other: true },
    });

    // Force map remount when container errors occur
    const forceMapRemount = () => {
        mapKey.current = Date.now();
        setError(null);
    };

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
                        mapRef.current.flyTo([latitude, longitude], 15, {
                            animate: true,
                            duration: 2.5
                        });
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
                            mapRef.current.flyTo([cachedLocation.lat, cachedLocation.lng], 15, {
                                animate: true,
                                duration: 2.5
                            });
                        }
                    } else {
                        // Only use default as absolute last resort
                        console.log('⚠️ Using default location as last resort');
                        const defaultLocation = { lat: 11.0168, lng: 76.9558 };
                        setUserLocation(defaultLocation);
                        if (mapRef.current) {
                            mapRef.current.flyTo([defaultLocation.lat, defaultLocation.lng], 15, {
                                animate: true,
                                duration: 2.5
                            });
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

    // --- FETCH ISSUES WHEN TOGGLED ON ---
    useEffect(() => {
        const fetchIssues = async () => {
            if (!showIssues) return;
            try {
                setIssueLoading(true);
                setIssueError('');
                const res = await issueAPI.getAll({ limit: 200, sort: '-createdAt' });
                const list = res?.data || [];
                setIssues(Array.isArray(list) ? list : []);
            } catch (e) {
                setIssueError(e.message || 'Failed to load issues');
            } finally {
                setIssueLoading(false);
            }
        };
        fetchIssues();
    }, [showIssues]);

    // --- FETCH SAFETY WHEN TOGGLED ON ---
    useEffect(() => {
        const fetchSafety = async () => {
            if (!showSafety) return;
            try {
                setSafetyLoading(true);
                setSafetyError('');
                const res = await safetyAPI.getAll({ limit: 200, sort: '-createdAt' });
                const list = res?.data || [];
                setSafetyAlerts(Array.isArray(list) ? list : []);
            } catch (e) {
                setSafetyError(e.message || 'Failed to load safety alerts');
            } finally {
                setSafetyLoading(false);
            }
        };
        fetchSafety();
    }, [showSafety]);

    // --- FETCH ACCESSIBILITY WHEN TOGGLED ON ---
    useEffect(() => {
        const fetchAcc = async () => {
            if (!showAccessibility) return;
            try {
                setAccLoading(true);
                setAccError('');
                const res = await accessibilityAPI.getAll({ limit: 200, sort: '-createdAt' });
                const list = res?.data || [];
                setAccReports(Array.isArray(list) ? list : []);
            } catch (e) {
                setAccError(e.message || 'Failed to load accessibility reports');
            } finally {
                setAccLoading(false);
            }
        };
        fetchAcc();
    }, [showAccessibility]);

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

        try {
            // Check if map container is properly initialized
            if (!mapRef.current._container) {
                console.warn('Map container not ready, delaying recenter');
                setTimeout(() => handleRecenterMap(), 100);
                return;
            }

            // Always center on the user's location with a smooth fly-to animation
            mapRef.current.flyTo(userLocation, 16, {
                animate: true,
                duration: 3,
            });

            // Ensure any residual rotation is cleared
            const mapContainer = mapRef.current.getContainer();
            if (mapContainer && mapContainer.style.transform !== 'rotate(0deg)') {
                mapContainer.style.transform = 'rotate(0deg)';
                mapContainer.style.transition = 'transform 0.3s ease-in-out'; // Faster transition
            }
        } catch (error) {
            console.warn('Error recentering map:', error);
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
            { 
                id: 1, 
                category: 'food', 
                lat: 11.0274, 
                lng: 76.9716, 
                name: 'Annapoorna Canteen', 
                photoUrls: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'], 
                description: 'Hot, nutritious meals for lunch.', 
                timing: '12:00 PM - 2:00 PM', 
                activeDays: 'Mon-Sat', 
                isFree: true, 
                address: '123 Gandhipuram, Coimbatore',
                googleMapsQuery: 'Annapoorna Canteen Gandhipuram Coimbatore',
                googleMapsLink: 'https://maps.google.com/maps?q=11.0274,76.9716',
                amenities: ['Free Meals', 'Clean Water', 'Seating Area']
            },
            { 
                id: 2, 
                category: 'food', 
                lat: 11.0055, 
                lng: 76.9667, 
                name: 'Community Kitchen', 
                photoUrls: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop'], 
                description: 'Evening meals for everyone.', 
                timing: '7:00 PM - 8:30 PM', 
                activeDays: 'All Days', 
                isFree: true, 
                address: '456 R.S. Puram, Coimbatore',
                googleMapsQuery: 'Community Kitchen R.S. Puram Coimbatore',
                googleMapsLink: 'https://maps.google.com/maps?q=11.0055,76.9667',
                amenities: ['Free Meals', 'Takeaway Available']
            },
            { 
                id: 3, 
                category: 'shelter', 
                lat: 11.0182, 
                lng: 76.9615, 
                name: 'Railway Station Night Shelter', 
                photoUrls: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop'], 
                description: 'Safe overnight stay for travelers.', 
                timing: '9:00 PM - 6:00 AM', 
                activeDays: 'All Days', 
                isFree: true, 
                address: 'Near Coimbatore Junction Railway Station',
                googleMapsQuery: 'Coimbatore Junction Railway Station Night Shelter',
                googleMapsLink: 'https://maps.google.com/maps?q=11.0182,76.9615',
                amenities: ['Beds', 'Blankets', 'Security']
            },
            { 
                id: 4, 
                category: 'shelter', 
                lat: 10.9950, 
                lng: 76.9450, 
                name: 'Ukkadam Bus Stand Shelter', 
                photoUrls: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop'], 
                description: 'Temporary shelter for women and children.', 
                timing: '24 Hours', 
                activeDays: 'All Days', 
                isFree: true, 
                address: 'Ukkadam Bus Stand, Coimbatore',
                googleMapsQuery: 'Ukkadam Bus Stand Coimbatore',
                googleMapsLink: 'https://maps.google.com/maps?q=10.9950,76.9450',
                amenities: ['Women Only', 'Children Friendly', '24/7']
            },
            { 
                id: 5, 
                category: 'restZone', 
                lat: 11.0040, 
                lng: 76.9600, 
                name: 'VOC Park', 
                photoUrls: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'], 
                description: 'Peaceful park benches to rest.', 
                timing: '6:00 AM - 8:00 PM', 
                activeDays: 'All Days', 
                isFree: true, 
                address: 'VOC Park, Coimbatore',
                googleMapsQuery: 'VOC Park Coimbatore',
                googleMapsLink: 'https://maps.google.com/maps?q=11.0040,76.9600',
                amenities: ['Park Benches', 'Greenery', 'Public Space']
            },
            { 
                id: 6, 
                category: 'restroom', 
                lat: 11.0145, 
                lng: 76.9588, 
                name: 'Town Hall Public Toilet', 
                photoUrls: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop'], 
                description: 'Clean and accessible public facilities.', 
                timing: '24 Hours', 
                activeDays: 'All Days', 
                isFree: false, 
                address: 'Near Town Hall, Coimbatore',
                googleMapsQuery: 'Town Hall Coimbatore Public Toilet',
                amenities: ['Clean Toilets', 'Water Supply', '24/7 Open']
            },
            { 
                id: 7, 
                category: 'food', 
                lat: 11.0193, 
                lng: 76.9565, 
                name: 'Amma Canteen', 
                photoUrls: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'], 
                description: 'Subsidized meals for all.', 
                timing: '6:00 AM - 10:00 AM, 12:00 PM - 3:00 PM, 7:00 PM - 9:00 PM', 
                activeDays: 'All Days', 
                isFree: false, 
                address: 'Near Gandhipuram Bus Stand, Coimbatore',
                googleMapsQuery: 'Amma Canteen Gandhipuram Bus Stand Coimbatore',
                amenities: ['Low Price', 'Dine-in', 'Quick Service']
            },
            { 
                id: 8, 
                category: 'food', 
                lat: 11.0135, 
                lng: 76.9634, 
                name: 'Sevai Kendra', 
                photoUrls: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop'], 
                description: 'Breakfast and lunch served daily.', 
                timing: '7:00 AM - 2:00 PM', 
                activeDays: 'All Days', 
                isFree: true, 
                address: 'Opposite Town Hall, Coimbatore',
                googleMapsQuery: 'Sevai Kendra Town Hall Coimbatore',
                amenities: ['Free Breakfast', 'Free Lunch']
            },
            { 
                id: 9, 
                category: 'food', 
                lat: 10.9987, 
                lng: 76.9512, 
                name: 'Ukkadam Food Bank', 
                photoUrls: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'], 
                description: 'Free meals and groceries for those in need.', 
                timing: '11:00 AM - 2:00 PM, 6:00 PM - 8:00 PM', 
                activeDays: 'All Days', 
                isFree: true, 
                address: 'Near Ukkadam Bus Stand, Coimbatore',
                googleMapsQuery: 'Ukkadam Food Bank Ukkadam Bus Stand Coimbatore',
                amenities: ['Groceries', 'Free Meals']
            },
            { 
                id: 10, 
                category: 'food', 
                lat: 11.0356, 
                lng: 76.9789, 
                name: 'Railway Station Food Counter', 
                photoUrls: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'], 
                description: '24/7 food service for travelers.', 
                timing: '24 Hours', 
                activeDays: 'All Days', 
                isFree: false, 
                address: 'Coimbatore Junction Railway Station',
                googleMapsQuery: 'Coimbatore Junction Railway Station Food Court',
                amenities: ['24/7 Open', 'Paid Food']
            },
            { 
                id: 11, 
                category: 'food', 
                lat: 11.0089, 
                lng: 76.9655, 
                name: 'Shanthi Social Service', 
                photoUrls: [
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'
                ], 
                description: 'Low price nutritious meals for everyone. Special rates for students and elderly.', 
                timing: '7:00 AM - 10:00 PM', 
                activeDays: 'All Days', 
                isFree: false, 
                address: 'Singanallur, Coimbatore',
                googleMapsQuery: 'Shanthi Social Service Singanallur Coimbatore',
                priceRange: '₹10-30 per meal',
                amenities: ['Low Price', 'Student Discount', 'Elderly Discount']
            },
            { 
                id: 12, 
                category: 'food', 
                lat: 11.00342, 
                lng: 77.03930, 
                name: 'Shanthi Social Services Canteen', 
                photoUrls: [
                    '/images/shanthi-food-1.jpg',
                    '/images/shanthi-food-2.jpg',
                    '/images/shanthi-food-3.jpg'
                ], 
                description: 'Well-maintained community canteen serving affordable, hygienic South Indian meals.', 
                timing: '7:00 AM – 9:15 PM', 
                activeDays: 'All Days', 
                isFree: false, 
                googleMapsQuery: 'Shanthi Social Services Canteen Coimbatore',
                amenities: ['Affordable Meals', 'Clean Dining Area', 'Free Parking']
            },
            { 
                id: 13,
                category: 'food',
                lat: 11.02136,
                lng: 76.99159,
                name: 'Sumathi Memorial Trust – Low-Cost Meals',
                photoUrls: [
                    '/images/sumathi-meal-1.jpg',
                    '/images/sumathi-meal-2.jpg',
                    '/images/sumathi-meal-3.jpg'
                ],
                description: 'Serving sambar rice (₹3) and curd rice (₹5) to about 250 people daily at very nominal cost.',
                timing: '12:00 PM - 3:00 PM',
                activeDays: 'All Days',
                isFree: false,
                googleMapsQuery: 'Sumathi Memorial Trust Coimbatore Low Cost Meals',
                amenities: ['Affordable Meals', 'Community Service', 'Quick Service']
            },
            { 
                id: 14,
                category: 'food',
                lat: 10.97803,
                lng: 76.73313,
                name: 'Isha Yoga Center Bhiksha Hall (Annadanam)',
                photoUrls: [
                    '/images/isha-bhiksha-1.jpg',
                    '/images/isha-bhiksha-2.jpg',
                    '/images/isha-bhiksha-3.jpg'
                ],
                description: 'Sacred communal dining hall serving free sattvic meals twice daily in silence, for volunteers and guests at Isha Yoga Center.',
                timing: 'Brunch: ~10:00–11:10 AM (3 batches)<br>Dinner: ~7:00–8:10 PM (3 batches)',
                activeDays: 'All Days',
                isFree: true,
                googleMapsQuery: 'Isha Yoga Center Bhiksha Hall Coimbatore',
                amenities: ['Free Sattvic Meals', 'Silent Dining', 'Volunteers & Guests']
            },
            { 
                id: 15,
                category: 'food',
                lat: 11.0058,
                lng: 76.9526,
                name: 'Gurudwara Singh Sabha (R.S. Puram)',
                photoUrls: [
                    '/images/gurudwara-sabha-1.jpg',
                    '/images/gurudwara-sabha-2.jpg',
                    '/images/gurudwara-sabha-3.jpg'
                ],
                description: 'Coimbatore\'s only Sikh gurudwara offering langar (free community meal) every Sunday and on special auspicious days.',
                timing: 'Langar served on Sundays and special days (timing varies)',
                activeDays: 'Sundays & Special Days',
                isFree: true,
                googleMapsQuery: 'Gurudwara Singh Sabha R.S. Puram Coimbatore',
                amenities: ['Langar Hall', 'Free Dispensary', 'Prayer Hall']
            },
            { 
                id: 16,
                category: 'food',
                lat: 11.0115,
                lng: 77.0300,
                name: 'RVS Padmavathi Social Service Food Court',
                photoUrls: [
                    '/images/rvs-foodcourt-1.jpg',
                    '/images/rvs-foodcourt-2.jpg',
                    '/images/rvs-foodcourt-3.jpg'
                ],
                description: 'A campus-based vegetarian food court offering varied, affordable meals in a clean, cozy setting.',
                timing: 'Lunch (typical campus hours) — exact hours not publicly listed',
                activeDays: 'All Days (campus open days)',
                isFree: false,
                googleMapsQuery: 'RVS Padmavathi Social Service Food Court Coimbatore',
                amenities: ['Budget-friendly meals', 'Cozy atmosphere', 'Vegetarian only']
            },
            { 
                id: 17,
                category: 'food',
                lat: 10.9971,
                lng: 76.9625,
                name: 'Shanthi Social Services Canteen – Kuniyamuthur',
                photoUrls: [
                    '/images/shanthi-kuniyamuthur-1.jpg',
                    '/images/shanthi-kuniyamuthur-2.jpg',
                    '/images/shanthi-kuniyamuthur-3.jpg'
                ],
                description: 'A hygienic, budget-friendly vegetarian canteen serving South Indian items like dosa, idli, lemon rice & buns at very low prices.',
                timing: '6:00 AM – 7:00 PM',
                activeDays: 'All Days',
                isFree: false,
                amenities: ['Budget Meals', 'Takeaway', 'Plenty of Parking']
            },
            { 
                id: 18,
                category: 'food',
                lat: 10.96680,
                lng: 76.96880,
                name: 'Jeeva Shanthy Trust – Anaiyaa Aduppu Community Kitchen',
                photoUrls: [
                    '/images/jeeva-shanthy-1.jpg',
                    '/images/jeeva-shanthy-2.jpg',
                    '/images/jeeva-shanthy-3.jpg'
                ],
                description: 'Community kitchen serving daily meals for needy families at very low cost in Coimbatore outskirts.',
                timing: '12:00 PM - 2:00 PM & 7:00 PM - 8:30 PM',
                activeDays: 'All Days',
                isFree: false,
                amenities: ['Community Meals', 'Affordable', 'Hygienic']
            },
            { 
                id: 19,
                category: 'food',
                lat: 10.97840,
                lng: 76.76010,
                name: 'Sri Ramakrishna Mission – Canteen & Annadanam',
                photoUrls: [
                    '/images/ramakrishna-1.jpg',
                    '/images/ramakrishna-2.jpg',
                    '/images/ramakrishna-3.jpg'
                ],
                description: 'Serving free meals to devotees, volunteers, and students as part of their annadanam program.',
                timing: 'Breakfast: 7:00 AM – 9:00 AM<br>Lunch: 12:00 PM – 2:00 PM',
                activeDays: 'All Days',
                isFree: true,
                amenities: ['Free Meals', 'Clean Hall', 'Spiritual Ambience']
            },
            { 
                id: 20,
                category: 'food',
                lat: 10.97540,
                lng: 76.75650,
                name: 'Isha Yoga Center – Annadanam Evening',
                photoUrls: [
                    '/images/isha-evening-1.jpg',
                    '/images/isha-evening-2.jpg',
                    '/images/isha-evening-3.jpg'
                ],
                description: 'Evening sattvic meal served to all volunteers & visitors.',
                timing: 'Dinner: ~7:00–8:00 PM',
                activeDays: 'All Days',
                isFree: true,
                amenities: ['Free Meals', 'Peaceful Environment']
            },
            { 
                id: 21,
                category: 'food',
                lat: 11.01540,
                lng: 76.97650,
                name: 'Annadanam Center – R.S. Puram',
                photoUrls: [
                    '/images/annadanam-rsp-1.jpg',
                    '/images/annadanam-rsp-2.jpg',
                    '/images/annadanam-rsp-3.jpg'
                ],
                description: 'Serving low-cost, nutritious meals for workers and students.',
                timing: '12:00 PM – 2:00 PM',
                activeDays: 'All Days',
                isFree: false,
                amenities: ['Affordable Meals', 'Quick Service']
            },
            { 
                id: 22,
                category: 'food',
                lat: 11.02560,
                lng: 76.98760,
                name: 'Sevai Center – Coimbatore South',
                photoUrls: [
                    '/images/sevai-south-1.jpg',
                    '/images/sevai-south-2.jpg',
                    '/images/sevai-south-3.jpg'
                ],
                description: 'Free or low-cost meal center for low-income families.',
                timing: 'Breakfast: 7:00 AM – 10:00 AM<br>Lunch: 12:00 PM – 2:00 PM',
                activeDays: 'All Days',
                isFree: true,
                amenities: ['Free Meals', 'Community Service']
            },
            { 
                id: 23,
                category: 'food',
                lat: 11.02840,
                lng: 76.99100,
                name: 'Melodic Trust – Free Meals', 
                photoUrls: [
                    '/images/melodic-1.jpg',
                    '/images/melodic-2.jpg',
                    '/images/melodic-3.jpg'
                ],
                description: 'Nonprofit organization serving free meals to street children and elderly.', 
                timing: '8:00 AM – 10:00 AM & 6:00 PM – 8:00 PM',
                activeDays: 'All Days',
                isFree: true,
                amenities: ['Free Meals', 'Street Children Focus', 'Elderly Friendly']
            },
            { 
                id: 24,
                category: 'food',
                lat: 11.02010,
                lng: 76.98210,
                name: 'Sri Annadanam Canteen – Gandhipuram', 
                photoUrls: [
                    '/images/annadanam-gandhi-1.jpg',
                    '/images/annadanam-gandhi-2.jpg',
                    '/images/annadanam-gandhi-3.jpg'
                ],
                description: 'Affordable meals for the general public, mainly rice-based South Indian items.', 
                timing: '12:00 PM – 2:00 PM & 7:00 PM – 8:30 PM',
                activeDays: 'All Days',
                isFree: false,
                amenities: ['Affordable Meals', 'Clean Environment']
            },
            { 
                id: 25,
                category: 'food',
                lat: 11.01800,
                lng: 76.97900,
                name: 'Sumathi Trust – Evening Meals', 
                photoUrls: [
                    '/images/sumathi-evening-1.jpg',
                    '/images/sumathi-evening-2.jpg',
                    '/images/sumathi-evening-3.jpg'
                ],
                description: 'Evening meals at nominal cost for low-income families.', 
                timing: '6:00 PM – 8:00 PM',
                activeDays: 'All Days',
                isFree: false,
                amenities: ['Affordable Meals', 'Community Oriented']
            },
            { 
                id: 26,
                category: 'food',
                lat: 11.01520,
                lng: 76.97750,
                name: 'Ramakrishna Mission – Lunch & Dinner', 
                photoUrls: [
                    '/images/ramakrishna-lunch-1.jpg',
                    '/images/ramakrishna-lunch-2.jpg',
                    '/images/ramakrishna-lunch-3.jpg'
                ],
                description: 'Free meals for devotees, volunteers & students.', 
                timing: 'Lunch: 12:00 PM – 2:00 PM<br>Dinner: 7:00 PM – 8:00 PM',
                activeDays: 'All Days',
                isFree: true,
                amenities: ['Free Meals', 'Clean Hall']
            },
            { 
                id: 27,
                category: 'food',
                lat: 11.01900,
                lng: 76.98000,
                name: 'Sri Annadanam Trust – Free Meal Center', 
                photoUrls: [
                    '/images/annadanam-trust-1.jpg',
                    '/images/annadanam-trust-2.jpg',
                    '/images/annadanam-trust-3.jpg'
                ],
                description: 'Serving meals free of cost to the needy every day.', 
                timing: '11:00 AM – 1:00 PM & 6:00 PM – 8:00 PM',
                activeDays: 'All Days',
                isFree: true,
                amenities: ['Free Meals', 'Community Focused']
            },
            { 
                id: 28,
                category: 'food',
                lat: 11.02150,
                lng: 76.98300,
                name: 'Melodia – Free Food Outreach', 
                photoUrls: [
                    '/images/melodia-1.jpg',
                    '/images/melodia-2.jpg',
                    '/images/melodia-3.jpg'
                ],
                description: 'Food outreach program serving meals to street children and underprivileged families.', 
                timing: '8:00 AM – 10:00 AM & 5:00 PM – 7:00 PM',
                activeDays: 'All Days',
                isFree: true,
                amenities: ['Free Meals', 'Community Service']
            }
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

    // Set initial category from URL
    useEffect(() => {
        if (categoryFromUrl && ['food', 'shelter', 'restZone', 'restroom'].includes(categoryFromUrl) && allLocations.length > 0 && mapRef.current) {
            handleCategoryClick(categoryFromUrl);
        }
    }, [categoryFromUrl, allLocations, mapRef.current]);

    // Cleanup map instance on component unmount
    useEffect(() => {
        return () => {
            try {
                if (mapRef.current) {
                    // Clear any timeouts
                    if (navigationTimeoutRef.current) {
                        clearTimeout(navigationTimeoutRef.current);
                    }
                    
                    // Reset map reference without calling remove() - React-Leaflet handles this
                    mapRef.current = null;
                }
            } catch (error) {
                console.warn('Map cleanup error:', error);
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
                        duration: 2.5
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


    const handleOpenInGoogleMaps = (location) => {
        // Use direct googleMapsLink if available, otherwise use search query
        const url = location.googleMapsLink || 
                   `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.googleMapsQuery || (location.name + ", Coimbatore"))}`;
        window.open(url, '_blank');
    };

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        
        if (category === 'all') {
            // Show all locations - zoom to fit all markers
            if (allLocations.length > 0 && mapRef.current) {
                try {
                    const group = new L.featureGroup(
                        allLocations.map(loc => L.marker([loc.lat, loc.lng]))
                    );
                    if (group.getBounds().isValid()) {
                        mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
                    }
                } catch (error) {
                    console.warn('Error fitting bounds for all locations:', error);
                    // Fallback to user location
                    if (userLocation && mapRef.current) {
                        mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
                    }
                }
            }
        } else {
            // Filter and show specific category
            const categoryLocations = allLocations.filter(loc => loc.category === category);
            if (categoryLocations.length > 0 && mapRef.current) {
                try {
                    // Add delay to ensure map is fully initialized
                    setTimeout(() => {
                        if (mapRef.current && mapRef.current._container) {
                            const group = new L.featureGroup(
                                categoryLocations.map(loc => L.marker([loc.lat, loc.lng]))
                            );
                            if (group.getBounds().isValid()) {
                                mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
                            }
                        }
                    }, 100);
                } catch (error) {
                    console.warn('Error fitting bounds for category:', error);
                    // Fallback to user location with delay
                    setTimeout(() => {
                        if (userLocation && mapRef.current && mapRef.current._container) {
                            try {
                                mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
                            } catch (fallbackError) {
                                console.warn('Fallback setView error:', fallbackError);
                            }
                        }
                    }, 100);
                }
            }
        }
    };



    if (!userLocation) {
        return <LocationLoader />;
    }

    return (
        <div className="map-page-container">
            <MapContainer 
                key={`map-${mapKey.current}`} // Use ref value for unique key with prefix
                ref={mapRef}
                center={userLocation || [11.0168, 76.9558]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
                zoomAnimation={true}
                zoomAnimationThreshold={4}
                fadeAnimation={true}
                markerZoomAnimation={true}
                whenCreated={(mapInstance) => {
                    // Ensure proper map initialization
                    try {
                        mapRef.current = mapInstance;
                        console.log('🗺️ Map instance created successfully');
                    } catch (error) {
                        console.error('Map creation error:', error);
                        forceMapRemount();
                    }
                }}
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
                                    mapRef.current.flyTo([loc.lat, loc.lng], 14, {
                                        animate: true,
                                        duration: 2.5
                                    });
                                }
                            },
                        }}
                    />
                ))}

                {/* Civic Issues markers (clustered) */}
                {showIssues && clusteredIssues.map((group, idx) => {
                    if (group.length === 1) {
                        const issue = group[0];
                        const [lng, lat] = issue.location.coordinates;
                        const iconKey =
                            issue.issueType === 'pothole' ? 'issue_pothole' :
                            issue.issueType === 'garbage' ? 'issue_garbage' :
                            issue.issueType === 'street-light' ? 'issue_street_light' :
                            issue.issueType === 'water-logging' ? 'issue_water_logging' :
                            'issue_other';
                        return (
                            <Marker key={`iss-${issue._id}`} position={[lat, lng]} icon={icons[iconKey]}>
                                <Popup>
                                    <div style={{ maxWidth: 220 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'capitalize' }}>{issue.issueType?.replace('-', ' ')}</div>
                                        {issue.photoUrl && (
                                            <img src={issue.photoUrl} alt={issue.issueType} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                                        )}
                                        <div style={{ fontSize: 13, color: '#222', marginBottom: 6 }}>{issue.description}</div>
                                        <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Status: {issue.status || 'reported'}</div>
                                        <button onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')} style={{
                                            background: '#FF6700', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer'
                                        }}>Open in Maps</button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                    // Cluster marker
                    const centroid = group.reduce((acc, it) => {
                        const [lng, lat] = it.location.coordinates;
                        return { lat: acc.lat + lat, lng: acc.lng + lng };
                    }, { lat: 0, lng: 0 });
                    centroid.lat /= group.length; centroid.lng /= group.length;
                    const clusterIcon = L.divIcon({
                        html: `<div class="cluster-pin">${group.length}</div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });
                    return (
                        <Marker key={`issc-${idx}`} position={[centroid.lat, centroid.lng]} icon={clusterIcon}
                            eventHandlers={{
                                click: () => {
                                    // Zoom in slightly on cluster click
                                    if (mapRef.current) {
                                        mapRef.current.flyTo([centroid.lat, centroid.lng], Math.min((mapRef.current.getZoom?.() || 14) + 2, 18), {
                                            animate: true,
                                            duration: 0.8
                                        });
                                    }
                                }
                            }}
                        />
                    );
                })}

                {/* Safety markers (clustered) */}
                {showSafety && clusteredSafety.map((group, idx) => {
                    if (group.length === 1) {
                        const a = group[0];
                        const [lng, lat] = a.location.coordinates;
                        const iconKey =
                            a.alertType === 'dark_street' ? 'safety_dark_street' :
                            a.alertType === 'harassment_spot' ? 'safety_harassment_spot' :
                            a.alertType === 'theft_risk' ? 'safety_theft_risk' :
                            a.alertType === 'animal_threat' ? 'safety_animal_threat' :
                            'safety_other';
                        return (
                            <Marker key={`safe-${a._id}`} position={[lat, lng]} icon={icons[iconKey]}>
                                <Popup>
                                    <div style={{ maxWidth: 220 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'capitalize' }}>{(a.alertType||'other').replace('_',' ')}</div>
                                        <div style={{ fontSize: 13, color: '#222', marginBottom: 6 }}>{a.description}</div>
                                        <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Severity: {a.severity || 'medium'} · Status: {a.status || 'active'}</div>
                                        <button onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')} style={{
                                            background: '#FF6700', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer'
                                        }}>Open in Maps</button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                    const centroid = group.reduce((acc, it) => {
                        const [lng, lat] = it.location.coordinates; return { lat: acc.lat + lat, lng: acc.lng + lng };
                    }, { lat: 0, lng: 0 });
                    centroid.lat /= group.length; centroid.lng /= group.length;
                    const clusterIcon = L.divIcon({
                        html: `<div class="cluster-pin">${group.length}</div>`, className: '', iconSize: [32,32], iconAnchor: [16,16]
                    });
                    return (
                        <Marker key={`safec-${idx}`} position={[centroid.lat, centroid.lng]} icon={clusterIcon}
                            eventHandlers={{ click: () => mapRef.current && mapRef.current.flyTo([centroid.lat, centroid.lng], Math.min((mapRef.current.getZoom?.()||14)+2,18), { animate:true, duration:0.8 }) }}
                        />
                    );
                })}

                {/* Accessibility markers (clustered) */}
                {showAccessibility && clusteredAcc.map((group, idx) => {
                    if (group.length === 1) {
                        const r = group[0];
                        const [lng, lat] = r.location.coordinates;
                        const iconKey =
                            r.issueType === 'construction' ? 'acc_construction' :
                            r.issueType === 'roadblock' ? 'acc_roadblock' :
                            r.issueType === 'elevator_outage' ? 'acc_elevator_outage' :
                            r.issueType === 'ramp_blocked' ? 'acc_ramp_blocked' :
                            'acc_other';
                        return (
                            <Marker key={`acc-${r._id}`} position={[lat, lng]} icon={icons[iconKey]}>
                                <Popup>
                                    <div style={{ maxWidth: 220 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'capitalize' }}>{(r.issueType||'other').replace('_',' ')}</div>
                                        <div style={{ fontSize: 13, color: '#222', marginBottom: 6 }}>{r.description}</div>
                                        <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Status: {r.status || 'active'}</div>
                                        <button onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')} style={{
                                            background: '#FF6700', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer'
                                        }}>Open in Maps</button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                    const centroid = group.reduce((acc, it) => {
                        const [lng, lat] = it.location.coordinates; return { lat: acc.lat + lat, lng: acc.lng + lng };
                    }, { lat: 0, lng: 0 });
                    centroid.lat /= group.length; centroid.lng /= group.length;
                    const clusterIcon = L.divIcon({
                        html: `<div class="cluster-pin">${group.length}</div>`, className: '', iconSize: [32,32], iconAnchor: [16,16]
                    });
                    return (
                        <Marker key={`accc-${idx}`} position={[centroid.lat, centroid.lng]} icon={clusterIcon}
                            eventHandlers={{ click: () => mapRef.current && mapRef.current.flyTo([centroid.lat, centroid.lng], Math.min((mapRef.current.getZoom?.()||14)+2,18), { animate:true, duration:0.8 }) }}
                        />
                    );
                })}

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
                    {/* Issues toggle */}
                    <button
                        onClick={() => setShowIssues((v) => !v)}
                        className={showIssues ? 'active' : ''}
                        title="Toggle civic issues layer"
                    >⚠️ Issues</button>
                    {/* Safety toggle */}
                    <button
                        onClick={() => setShowSafety((v) => !v)}
                        className={showSafety ? 'active' : ''}
                        title="Toggle safety alerts layer"
                    >🛡️ Safety</button>
                    {/* Accessibility toggle */}
                    <button
                        onClick={() => setShowAccessibility((v) => !v)}
                        className={showAccessibility ? 'active' : ''}
                        title="Toggle accessibility layer"
                    >♿ Access</button>
                </div>
            )}

            {/* Issues Filters Panel */}
            {showIssues && !isNavigating && (
                <div style={{
                    position: 'fixed',
                    top: 70,
                    left: 10,
                    right: 10,
                    background: 'rgba(26,26,26,0.95)',
                    color: '#fff',
                    borderRadius: 12,
                    padding: 10,
                    zIndex: 1001,
                    border: '1px solid #333'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>Civic Issues</div>
                        {issueLoading && <div style={{ fontSize: 12, color: '#aaa' }}>Loading…</div>}
                    </div>
                    {issueError && <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 8, borderRadius: 8, marginBottom: 8 }}>{issueError}</div>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        {/* Status filters */}
                        {['reported','verified','resolved'].map((st) => (
                            <label key={st} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={!!issueFilters.status[st]}
                                    onChange={(e) => setIssueFilters((f) => ({ ...f, status: { ...f.status, [st]: e.target.checked } }))}
                                /> {st}
                            </label>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {/* Type filters */}
                        {[{k:'pothole',l:'Pothole'},{k:'garbage',l:'Garbage'},{k:'street-light',l:'Street light'},{k:'water-logging',l:'Water logging'},{k:'other',l:'Other'}].map(t => (
                            <label key={t.k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={!!issueFilters.types[t.k]}
                                    onChange={(e) => setIssueFilters((f) => ({ ...f, types: { ...f.types, [t.k]: e.target.checked } }))}
                                /> {t.l}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Safety Filters Panel */}
            {showSafety && !isNavigating && (
                <div style={{
                    position: 'fixed', top: 70, left: 10, right: 10,
                    background: 'rgba(26,26,26,0.95)', color: '#fff', borderRadius: 12, padding: 10, zIndex: 1001, border: '1px solid #333'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>Safety Alerts</div>
                        {safetyLoading && <div style={{ fontSize: 12, color: '#aaa' }}>Loading…</div>}
                    </div>
                    {safetyError && <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 8, borderRadius: 8, marginBottom: 8 }}>{safetyError}</div>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        {['active','resolved'].map((st)=>(
                            <label key={st} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                                <input type="checkbox" checked={!!safetyFilters.status[st]} onChange={(e)=> setSafetyFilters(f=> ({...f, status:{...f.status,[st]: e.target.checked}}))} /> {st}
                            </label>
                        ))}
                    </div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        {[{k:'dark_street',l:'Dark street'},{k:'harassment_spot',l:'Harassment'},{k:'theft_risk',l:'Theft risk'},{k:'animal_threat',l:'Animal threat'},{k:'other',l:'Other'}].map(t=> (
                            <label key={t.k} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                                <input type="checkbox" checked={!!safetyFilters.types[t.k]} onChange={(e)=> setSafetyFilters(f=> ({...f, types:{...f.types,[t.k]: e.target.checked}}))} /> {t.l}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Accessibility Filters Panel */}
            {showAccessibility && !isNavigating && (
                <div style={{
                    position: 'fixed', top: 70, left: 10, right: 10,
                    background: 'rgba(26,26,26,0.95)', color: '#fff', borderRadius: 12, padding: 10, zIndex: 1001, border: '1px solid #333'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>Accessibility</div>
                        {accLoading && <div style={{ fontSize: 12, color: '#aaa' }}>Loading…</div>}
                    </div>
                    {accError && <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 8, borderRadius: 8, marginBottom: 8 }}>{accError}</div>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        {['active','resolved'].map((st)=>(
                            <label key={st} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                                <input type="checkbox" checked={!!accFilters.status[st]} onChange={(e)=> setAccFilters(f=> ({...f, status:{...f.status,[st]: e.target.checked}}))} /> {st}
                            </label>
                        ))}
                    </div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        {[{k:'construction',l:'Construction'},{k:'roadblock',l:'Roadblock'},{k:'elevator_outage',l:'Elevator outage'},{k:'ramp_blocked',l:'Ramp blocked'},{k:'other',l:'Other'}].map(t=> (
                            <label key={t.k} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                                <input type="checkbox" checked={!!accFilters.types[t.k]} onChange={(e)=> setAccFilters(f=> ({...f, types:{...f.types,[t.k]: e.target.checked}}))} /> {t.l}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Recenter Button - Always visible */}
            <button
                className={`recenter-btn ${isFollowingUser ? 'following' : ''}`}
                onClick={handleRecenterMap}

                title={isNavigating ? "Recenter and follow navigation" : "Center on my location"}
            >
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
                        <div className="sheet-photos">
                            {selectedLocation.photoUrls?.map((url, index) => (
                                <img 
                                    key={index} 
                                    src={url} 
                                    alt={`${selectedLocation.name} photo ${index + 1}`} 
                                    className="sheet-photo"
                                />
                            ))}
                        </div>
                        <div className="sheet-header">
                            <h3>{selectedLocation.name}</h3>
                            <div className="header-tags-row">
                                {selectedLocation.isFree && <button className="header-tag tag-free" disabled>Free</button>}
                                <button className="header-tag tag-distance" disabled>{userLocation ? `${(L.latLng(userLocation).distanceTo(L.latLng(selectedLocation.lat, selectedLocation.lng)) / 1000).toFixed(1)} km` : ''}</button>
                                <button 
                                    className="header-tag tag-gmaps"
                                    onClick={() => handleOpenInGoogleMaps(selectedLocation)}
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
                            {selectedLocation.priceRange && (
                                <p><strong>Price:</strong> {selectedLocation.priceRange}</p>
                            )}
                        </div>
                        {selectedLocation.amenities && selectedLocation.amenities.length > 0 && (
                            <div className="sheet-amenities">
                                {selectedLocation.amenities.map((amenity, index) => (
                                    <span key={index} className="amenity-tag">{amenity}</span>
                                ))}
                            </div>
                        )}
                        <div className="sheet-actions-row">
                            <button className="sheet-action-button navigate-button" onClick={() => handleNavigateClick(selectedLocation)}>
                                Navigate →
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};


export default MapPage;
