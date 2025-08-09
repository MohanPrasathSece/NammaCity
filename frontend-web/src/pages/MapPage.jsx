import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// leaflet marker icon fix for parcel/vite
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
});

const defaultCenter = [11.0168, 76.9558];

const categories = [
  { id: 'all', name: 'All', color: '#007AFF' },
  { id: 'hospital', name: 'Health', color: '#34C759' },
  { id: 'transport', name: 'Transport', color: '#FF9500' },
  { id: 'emergency', name: 'Emergency', color: '#FF3B30' },
  { id: 'utility', name: 'Utilities', color: '#5856D6' },
];

const services = [
  {
    id: 1,
    title: 'Coimbatore Medical College Hospital',
    category: 'hospital',
    position: [11.0168, 76.9558],
    description: 'Government Medical College Hospital',
  },
  {
    id: 2,
    title: 'Central Bus Stand',
    category: 'transport',
    position: [11.005, 76.965],
    description: 'Main bus terminal',
  },
  {
    id: 3,
    title: 'Fire Station',
    category: 'emergency',
    position: [11.02, 76.95],
    description: 'Fire and Rescue Services',
  },
  {
    id: 4,
    title: 'Police Station',
    category: 'emergency',
    position: [11.01, 76.96],
    description: 'Local Police Station',
  },
  {
    id: 5,
    title: 'Water Treatment Plant',
    category: 'utility',
    position: [11.03, 76.94],
    description: 'Municipal Water Supply',
  },
];

export default function MapPage() {
  const [userPos, setUserPos] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Acquire user geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.warn('Geolocation error', err),
      { enableHighAccuracy: true }
    );
  }, []);

  const filtered = useMemo(() => {
    return selectedCategory === 'all'
      ? services
      : services.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Urban Services Map</h3>
        <button onClick={() => setUserPos(null)}>Recenter</button>
      </header>

      {/* Category buttons */}
      <div style={{ padding: '0.5rem 1rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              marginRight: '0.5rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '16px',
              border: 'none',
              background: selectedCategory === cat.id ? cat.color : '#f1f1f1',
              color: selectedCategory === cat.id ? '#fff' : '#333',
              cursor: 'pointer',
            }}>
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <MapContainer center={userPos || defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {/* User marker */}
          {userPos && (
            <CircleMarker center={userPos} radius={8} pathOptions={{ color: '#007AFF' }}>
              <Popup>You are here</Popup>
            </CircleMarker>
          )}
          {/* Service markers */}
          {filtered.map((s) => (
            <Marker key={s.id} position={s.position}>
              <Popup>
                <strong>{s.title}</strong>
                <br />
                {s.description}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
