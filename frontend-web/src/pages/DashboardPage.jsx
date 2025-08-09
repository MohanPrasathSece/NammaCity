import { useEffect, useState } from 'react';
import { servicesAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      const data = await servicesAPI.getServices();
      setItems(data);
    };
    fetchItems();
  }, []);

  return (
    <main style={{ padding: '1rem' }}>
      <h2>Welcome, {user?.name}</h2>
      <button onClick={logout}>Logout</button>
      <h3>Your Items</h3>
      <ul>
        {items.map((it) => (
          <li key={it._id}>{it.name}</li>
        ))}
      </ul>
    </main>
  );
}
