import React, { useState, useEffect } from 'react';
import { safetyAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ReportSafety() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ alertType: 'dark_street', description: '', severity: 'medium' });
  const [loc, setLoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLoc(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!loc) return setError('Location not available. Please enable GPS.');
    try {
      setSubmitting(true);
      const payload = {
        alertType: form.alertType,
        description: form.description,
        severity: form.severity,
        location: { type: 'Point', coordinates: [loc.lng, loc.lat] }
      };
      await safetyAPI.create(payload);
      setSuccess('Safety alert submitted. Thank you!');
      setTimeout(() => navigate('/map'), 1000);
    } catch (e) {
      setError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16, color: '#fff', background: '#0A0A0A', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Report Safety Alert</h1>
      <p style={{ color: '#a0a0a0', marginBottom: 16 }}>Help others by reporting unsafe spots.</p>
      {error && <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#1f3b29', color: '#b0ffcb', padding: 10, borderRadius: 8, marginBottom: 12 }}>{success}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Alert Type</span>
          <select value={form.alertType} onChange={(e)=> setForm(f=>({...f, alertType: e.target.value}))} style={{ padding: 10, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #2a2a2a' }}>
            <option value="dark_street">Dark street</option>
            <option value="harassment_spot">Harassment spot</option>
            <option value="theft_risk">Theft risk</option>
            <option value="animal_threat">Animal threat</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Severity</span>
          <select value={form.severity} onChange={(e)=> setForm(f=>({...f, severity: e.target.value}))} style={{ padding: 10, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #2a2a2a' }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Description</span>
          <textarea value={form.description} onChange={(e)=> setForm(f=>({...f, description: e.target.value}))} rows={4} placeholder="Describe what makes it unsafe..." style={{ padding: 10, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #2a2a2a' }} />
        </label>
        <button disabled={submitting} type="submit" style={{ background: '#FF6700', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }}>
          {submitting ? 'Submitting…' : 'Submit Alert'}
        </button>
      </form>
    </div>
  );
}
