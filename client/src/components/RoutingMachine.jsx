import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Polyline } from 'react-leaflet';
import L from 'leaflet';

const RoutingMachine = React.forwardRef(({ setInstructions }, ref) => {
    const map = useMap();
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    // Expose a method to the parent to fetch and display route
    useImperativeHandle(ref, () => ({
        setWaypoints: async (start, end) => {
            
            try {
                // Use free OSRM routing service (reliable and works without API issues)
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?geometries=geojson&steps=true&overview=full`
                );
                
                if (!response.ok) {
                    throw new Error(`OSRM HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('✅ Route calculated successfully:', {
                    distance: (data.routes[0]?.distance / 1000).toFixed(1) + ' km',
                    duration: Math.round(data.routes[0]?.duration / 60) + ' min',
                    steps: data.routes[0]?.legs[0]?.steps?.length + ' instructions'
                });
                
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    
                    // Route coordinates set successfully
                    setRouteCoordinates(coordinates);
                    
                    // Set route instructions for the navigation panel
                    const routeInfo = {
                        name: `Route to destination`,
                        instructions: route.legs[0]?.steps?.map((step, index) => {
                            const isFirst = index === 0;
                            const isLast = index === route.legs[0].steps.length - 1;
                            
                            // Get detailed maneuver information from OSRM
                            const maneuver = step.maneuver || {};
                            const maneuverType = maneuver.type || 'straight';
                            const modifier = maneuver.modifier || '';
                            const roadName = step.name || '';
                            
                            let direction = 'straight';
                            let instructionText = '';
                            
                            if (isLast) {
                                direction = 'arrive';
                                instructionText = `🏁 You have arrived at your destination`;
                            } else if (isFirst) {
                                direction = 'straight';
                                instructionText = `🚗 Head ${modifier || 'straight'}${roadName ? ' on ' + roadName : ''}`;
                            } else {
                                // Parse different maneuver types from OSRM
                                switch (maneuverType) {
                                    case 'turn':
                                        if (modifier.includes('left')) {
                                            direction = 'left';
                                            instructionText = `↰ Turn left${roadName ? ' onto ' + roadName : ''}`;
                                        } else if (modifier.includes('right')) {
                                            direction = 'right';
                                            instructionText = `↱ Turn right${roadName ? ' onto ' + roadName : ''}`;
                                        } else {
                                            instructionText = `➤ Turn ${modifier}${roadName ? ' onto ' + roadName : ''}`;
                                        }
                                        break;
                                    case 'merge':
                                        direction = modifier.includes('left') ? 'left' : 'right';
                                        instructionText = `🔀 Merge ${modifier}${roadName ? ' onto ' + roadName : ''}`;
                                        break;
                                    case 'ramp':
                                        direction = modifier.includes('left') ? 'left' : 'right';
                                        instructionText = `🛣️ Take the ramp ${modifier}${roadName ? ' to ' + roadName : ''}`;
                                        break;
                                    case 'roundabout':
                                        direction = 'straight';
                                        instructionText = `🔄 Enter roundabout and take exit${roadName ? ' to ' + roadName : ''}`;
                                        break;
                                    case 'fork':
                                        direction = modifier.includes('left') ? 'left' : 'right';
                                        instructionText = `🍴 Keep ${modifier} at fork${roadName ? ' onto ' + roadName : ''}`;
                                        break;
                                    case 'continue':
                                    case 'straight':
                                    default:
                                        direction = 'straight';
                                        instructionText = `⬆️ Continue straight${roadName ? ' on ' + roadName : ''}`;
                                        break;
                                }
                            }
                            
                            // Log removed to prevent continuous logging

                            return {
                                type: isFirst ? 'depart' : isLast ? 'arrive' : 'continue',
                                text: instructionText,
                                distance: step.distance || (route.distance / route.legs[0].steps.length), // Fallback to average
                                time: step.duration || (route.duration / route.legs[0].steps.length), // Fallback to average
                                road: step.name || 'Road',
                                direction: direction,
                            };
                        }) || [
                            {
                                type: 'depart',
                                text: `Head to destination (${(route.distance / 1000).toFixed(1)} km)`,
                                distance: route.distance || 0,
                                time: route.duration || 0,
                                road: 'Route',
                                direction: 'straight',
                            }
                        ],
                        summary: {
                            totalDistance: route.distance,
                            totalTime: route.duration,
                        },
                        coordinates: coordinates
                    };
                    
                    setInstructions(routeInfo);
                } else {
                    throw new Error('No routes found');
                }
                
            } catch (error) {
                console.error('❌ MapTiler routing failed:', error);
                
                // Fallback: create a simple curved route
                console.log('🔄 Using fallback curved route...');
                const fallbackCoords = [
                    start,
                    [
                        start[0] + (end[0] - start[0]) * 0.25,
                        start[1] + (end[1] - start[1]) * 0.15
                    ],
                    [
                        start[0] + (end[0] - start[0]) * 0.5,
                        start[1] + (end[1] - start[1]) * 0.6
                    ],
                    [
                        start[0] + (end[0] - start[0]) * 0.75,
                        start[1] + (end[1] - start[1]) * 0.85
                    ],
                    end
                ];
                
                setRouteCoordinates(fallbackCoords);
                
                // Calculate distance for fallback
                const distance = L.latLng(start).distanceTo(L.latLng(end));
                const fallbackRoute = {
                    name: `Route to destination`,
                    instructions: [{
                        type: 'depart',
                        text: `Head to destination (${(distance/1000).toFixed(1)} km)`,
                        distance: distance,
                        time: (distance / 1000) * 90,
                        road: 'Direct route',
                        direction: 'straight',
                    }],
                    summary: {
                        totalDistance: distance,
                        totalTime: (distance / 1000) * 90,
                    }
                };
                
                setInstructions(fallbackRoute);
            }
        }
    }));

    // Render the route line if we have coordinates
    if (routeCoordinates.length > 0) {
        // Validate coordinates to prevent NaN errors
        const validCoordinates = routeCoordinates.filter(coord => 
            Array.isArray(coord) && 
            coord.length === 2 && 
            !isNaN(coord[0]) && 
            !isNaN(coord[1]) &&
            isFinite(coord[0]) && 
            isFinite(coord[1])
        );
        
        if (validCoordinates.length > 0) {
            return (
                <Polyline
                    positions={validCoordinates}
                    color="#FF6700"
                    weight={7}
                    opacity={0.9}
                />
            );
        }
    }

    return null;
});

export default RoutingMachine;
