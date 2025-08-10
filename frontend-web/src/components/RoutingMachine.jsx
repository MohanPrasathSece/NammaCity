import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

const RoutingMachine = React.forwardRef(({ setInstructions }, ref) => {
    const map = useMap();
    const routingControlRef = useRef(null);

    // This effect runs only ONCE to create the routing control
    useEffect(() => {
        if (!map) return;

        // Custom router class for MapTiler API
        const CustomRouter = L.Class.extend({
            initialize: function(options) {
                L.setOptions(this, options);
            },

            route: function(waypoints, callback, context) {
                // Always use direct route for now to avoid API issues
                if (waypoints.length < 2) {
                    callback.call(context, { message: 'Need at least 2 waypoints' });
                    return this;
                }

                const start = waypoints[0].latLng;
                const end = waypoints[waypoints.length - 1].latLng;
                
                // Calculate distance using Haversine formula
                const R = 6371e3; // Earth's radius in meters
                const φ1 = start.lat * Math.PI/180;
                const φ2 = end.lat * Math.PI/180;
                const Δφ = (end.lat-start.lat) * Math.PI/180;
                const Δλ = (end.lng-start.lng) * Math.PI/180;

                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;

                // Estimate time (assuming 40 km/h average speed in city)
                const estimatedTime = (distance / 1000) * 90; // seconds

                // Create a simple route with multiple points for better visualization
                const midLat = (start.lat + end.lat) / 2;
                const midLng = (start.lng + end.lng) / 2;
                
                setTimeout(() => {
                    callback.call(context, null, [{
                        name: `Route to destination`,
                        coordinates: [start, L.latLng(midLat, midLng), end],
                        instructions: [
                            {
                                type: 'depart',
                                text: `Head towards ${end.lat > start.lat ? 'north' : 'south'}${end.lng > start.lng ? 'east' : 'west'}`,
                                distance: distance / 2,
                                time: estimatedTime / 2,
                                road: 'Main route',
                                direction: 'straight',
                            },
                            {
                                type: 'arrive',
                                text: `Arrive at destination (${(distance/1000).toFixed(1)} km total)`,
                                distance: distance / 2,
                                time: estimatedTime / 2,
                                road: 'Destination',
                                direction: 'straight',
                            }
                        ],
                        summary: {
                            totalDistance: distance,
                            totalTime: estimatedTime,
                        },
                        inputWaypoints: waypoints,
                        waypoints: waypoints,
                    }]);
                }, 500); // Small delay to simulate API call
                return this;
            }
        });

        const instance = L.Routing.control({
            waypoints: [], // Waypoints are set later by the parent
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            lineOptions: { styles: [{ color: '#FF6700', opacity: 0.9, weight: 7 }] },
            createMarker: () => null, // We use our own markers
            router: new CustomRouter(),
        }).on('routesfound', (e) => {
            if (e.routes && e.routes.length > 0) {
                setInstructions(e.routes[0]);
            }
        }).addTo(map);

        routingControlRef.current = instance;

        return () => {
            if (map && routingControlRef.current) {
                map.removeControl(routingControlRef.current);
            }
        };
    }, [map, setInstructions]);

    // Expose a method to the parent to update waypoints imperatively
    useImperativeHandle(ref, () => ({
        setWaypoints: (start, end) => {
            if (routingControlRef.current) {
                routingControlRef.current.setWaypoints([
                    L.latLng(start[0], start[1]),
                    L.latLng(end[0], end[1])
                ]);
            }
        }
    }));

    return null;
});

export default RoutingMachine;
