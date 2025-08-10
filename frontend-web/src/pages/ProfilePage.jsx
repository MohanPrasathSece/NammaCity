import { useAuth } from '../context/AuthContext.jsx';
import { userAPI } from '../services/api.js';
import { useEffect, useState } from 'react';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await userAPI.getStats();
        setStats(res.data || res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-card">
        <img src={user?.avatar || '/avatar.png'} alt="avatar" className="avatar" />
        <h2>{user?.name}</h2>
        <p>{user?.email}</p>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      <div className="profile-sections">
        <div className="section-link" onClick={() => location.href='/journal'}>📝 My Journal</div>
        <div className="section-link" onClick={() => location.href='/bookmarks'}>📌 My Bookmarks</div>
        <div className="section-link" onClick={() => alert('Settings coming soon')}>⚙️ Settings</div>
      </div>

      {stats && (
        <div className="stats">
          <h3>Stats</h3>
          <p>Entries: {stats.entries}</p>
          <p>Bookmarks: {stats.bookmarks}</p>
        </div>
      )}
    </div>
  );
}
