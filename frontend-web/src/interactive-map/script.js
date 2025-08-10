document.addEventListener('DOMContentLoaded', () => {
    // --- MAP INITIALIZATION ---
    // Initialize the map and set its view to a default location (e.g., center of a city)
    // This will be overridden if the user's location is successfully retrieved.
    const map = L.map('map').setView([11.0168, 76.9558], 13); // Default to Coimbatore

    // --- TILE LAYER ---
    // Add the OpenStreetMap tiles to the map.
    // No API key is required for OpenStreetMap.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // --- VARIABLES ---
    let userLocationMarker;
    let routingControl;
    const instructionsDiv = document.getElementById('instructions');

    // --- DESTINATION MARKERS ---
    // Add your destination markers here.
    // You can add as many as you like. Each marker needs a latitude, longitude, and a name.
    const destinations = [
        { lat: 11.0274, lng: 76.9716, name: 'Fun Mall' },
        { lat: 11.0055, lng: 76.9667, name: 'Race Course' },
        { lat: 10.9991, lng: 76.9350, name: 'Ukkadam' }
    ];

    // Add destination markers to the map
    destinations.forEach(dest => {
        const marker = L.marker([dest.lat, dest.lng]).addTo(map);
        marker.bindPopup(`<b>${dest.name}</b><br><button class='nav-button' data-lat='${dest.lat}' data-lng='${dest.lng}'>Navigate Here</button>`);
    });

    // --- GEOLOCATION ---
    // Try to get the user's current location.
    map.locate({ watch: true, setView: true, maxZoom: 16 });

    // --- EVENT LISTENERS ---

    // When location is found, update the user's marker.
    function onLocationFound(e) {
        const radius = e.accuracy / 2;

        if (userLocationMarker) {
            userLocationMarker.setLatLng(e.latlng).setPopupContent(`You are within ${radius} meters from this point`);
        } else {
            userLocationMarker = L.marker(e.latlng).addTo(map)
                .bindPopup(`You are here`).openPopup();
        }

        // If a route is active, update it with the new user location
        if (routingControl) {
            const waypoints = routingControl.getWaypoints();
            routingControl.setWaypoints([
                e.latlng,
                waypoints[1].latLng
            ]);
        }
    }

    // Handle location error, e.g., user denies permission.
    function onLocationError(e) {
        alert("Could not access your location. Please enable location services in your browser settings. Defaulting to a central location.");
        // You can set a default view if location is denied
        map.setView([11.0168, 76.9558], 13);
    }

    // Function to create or update the route
    function createRoute(start, end) {
        // If a routing control already exists, just update its waypoints
        if (routingControl) {
            routingControl.setWaypoints([
                start,
                end
            ]);
        } else {
            // Otherwise, create a new routing control
            routingControl = L.Routing.control({
                waypoints: [start, end],
                routeWhileDragging: true,
                // Use OSRM's free routing service
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                }),
                // Hide the default itinerary
                show: false,
                // Custom line styling
                lineOptions: {
                    styles: [{ color: 'blue', opacity: 0.8, weight: 6 }]
                },
                // Do not add the container to the map automatically
                addWaypoints: false,
                createMarker: function() { return null; } // Do not create start/end markers
            }).addTo(map);
        }

        // Listen for routing events to update the custom instructions panel
        routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            instructionsDiv.innerHTML = `<h2>Navigation to Destination</h2>
                                       <p>Total distance: ${(summary.totalDistance / 1000).toFixed(2)} km</p>
                                       <p>Estimated time: ${Math.round(summary.totalTime / 60)} minutes</p>`;
            
            // Add step-by-step instructions
            const instructions = routes[0].instructions;
            let stepsHtml = '<ol>';
            instructions.forEach(step => {
                stepsHtml += `<li>${step.text} (${(step.distance / 1000).toFixed(2)} km)</li>`;
            });
            stepsHtml += '</ol>';
            instructionsDiv.innerHTML += stepsHtml;
            instructionsDiv.style.display = 'block'; // Show the instructions panel
        });
    }

    // --- MAP EVENT BINDING ---
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    // Event delegation for the 'Navigate Here' button inside popups
    map.on('popupopen', function() {
        document.querySelector('.nav-button').addEventListener('click', function(e) {
            const destLat = e.target.getAttribute('data-lat');
            const destLng = e.target.getAttribute('data-lng');
            const destination = L.latLng(destLat, destLng);

            if (userLocationMarker) {
                createRoute(userLocationMarker.getLatLng(), destination);
                map.closePopup();
            } else {
                alert('Could not get your current location to start navigation.');
            }
        });
    });
});
