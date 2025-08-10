import { useEffect, useState } from 'react';
import { serviceAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await serviceAPI.getAll();
        setItems(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch services:', error);
        setItems([]);
      }
    };
    fetchItems();
  }, []);

  return (
    <main style={{ padding: '1rem', backgroundColor: '#0a0a0a', color: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#FF6700', marginBottom: '1rem' }}>Welcome, {user?.name}!</h2>
        <button 
          onClick={logout}
          style={{
            backgroundColor: '#FF6700',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      
      <div>
        <h3 style={{ color: '#FF6700', marginBottom: '1rem' }}>Affordable Food Places ({items.length})</h3>
        {items.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            backgroundColor: '#1a1a1a', 
            borderRadius: '10px',
            border: '1px solid #333'
          }}>
            <p style={{ color: '#888', marginBottom: '1rem' }}>No services found</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Make sure the backend is running and seeded with data
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {items.map((service) => (
              <div 
                key={service._id} 
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '10px',
                  padding: '1rem',
                  transition: 'border-color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = '#FF6700'}
                onMouseLeave={(e) => e.target.style.borderColor = '#333'}
              >
                <h4 style={{ color: '#FF6700', margin: '0 0 0.5rem 0' }}>{service.name}</h4>
                <p style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                  {service.description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#888' }}>
                  <span>📍 {service.location?.address}</span>
                  <span>⭐ {service.rating?.average || 0}/5</span>
                  <span>📞 {service.contact?.phone}</span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{
                    backgroundColor: '#FF6700',
                    color: 'white',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}>
                    {service.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
