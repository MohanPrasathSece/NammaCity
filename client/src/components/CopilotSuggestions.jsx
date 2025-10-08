import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { weatherAPI } from '../services/api';
import { useLocation as useLocationContext } from '../context/LocationContext.jsx';

export default function CopilotSuggestions() {
  const navigate = useNavigate();
  const { userLocation } = useLocationContext();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!userLocation) return;
      try {
        setLoading(true);
        setError('');
        const res = await weatherAPI.getCurrent(userLocation.lat, userLocation.lng);
        // API returns { success, data } or similar; normalize
        setWeather(res.data || res);
      } catch (e) {
        setError(e.message || 'Failed to fetch weather');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userLocation]);

  const suggestions = useMemo(() => {
    const s = [];
    const now = new Date();
    const hour = now.getHours();
    const raining = (() => {
      const desc = (weather?.condition || weather?.weather?.[0]?.main || '').toString().toLowerCase();
      return desc.includes('rain') || desc.includes('drizzle') || desc.includes('storm');
    })();

    if (raining) {
      s.push({
        icon: '🌧️',
        title: "It's raining",
        text: 'Nearest sheltered bus stop or indoor spot might help.',
        action: () => navigate('/map?category=shelter'),
        actionText: 'Find Shelter',
      });
    }

    // Daytime study/library suggestion
    if (hour >= 10 && hour <= 18) {
      s.push({
        icon: '📚',
        title: 'Quiet study time',
        text: 'Libraries and study zones are usually calmer now.',
        action: () => navigate('/map?category=restZone'),
        actionText: 'Find Study Zone',
      });
    }

    // Meal-time food suggestion
    if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) {
      s.push({
        icon: '🍲',
        title: 'Nearby low-cost meals',
        text: 'Community kitchens and canteens may be serving now.',
        action: () => navigate('/map?category=food'),
        actionText: 'Find Food',
      });
    }

    // Restroom suggestion always available
    s.push({
      icon: '🚻',
      title: 'Public restrooms',
      text: 'Locate the nearest clean public facility.',
      action: () => navigate('/map?category=restroom'),
      actionText: 'Find Restroom',
    });

    return s;
  }, [weather, navigate]);

  if (!userLocation) return null;

  return (
    <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 12, margin: '12px 0', border: '1px solid #2a2a2a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>🧭</span>
        <div style={{ fontWeight: 700 }}>City Copilot</div>
        {loading && <div style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>Loading…</div>}
      </div>
      {error && (
        <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 8, borderRadius: 8, marginBottom: 8 }}>{error}</div>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ background: '#0F0F0F', border: '1px solid #2a2a2a', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div style={{ color: '#cfcfcf', fontSize: 13 }}>{s.text}</div>
            </div>
            <button onClick={s.action} style={{ background: '#FF6700', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {s.actionText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
