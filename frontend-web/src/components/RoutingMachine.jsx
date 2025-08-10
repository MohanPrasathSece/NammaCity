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

        const instance = L.Routing.control({
            waypoints: [], // Waypoints are set later by the parent
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            lineOptions: { styles: [{ color: '#FF6700', opacity: 0.9, weight: 7 }] },
            createMarker: () => null, // We use our own markers
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
