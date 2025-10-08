import React, { useState, useEffect } from 'react';
import { accessibilityAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ReportAccessibility() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ issueType: 'construction', description: '', status: 'active', wheelchairFriendly: false, hasRamp: false, hasElevator: false });
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
        issueType: form.issueType,
        description: form.description,
        status: form.status,
        accessibility: {
          wheelchairFriendly: !!form.wheelchairFriendly,
          hasRamp: !!form.hasRamp,
          hasElevator: !!form.hasElevator,
        },
        location: { type: 'Point', coordinates: [loc.lng, loc.lat] }
      };
      await accessibilityAPI.create(payload);
      setSuccess('Accessibility report submitted. Thank you!');
      setTimeout(() => navigate('/map'), 1000);
    } catch (e) {
      setError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16, color: '#fff', background: '#0A0A0A', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Report Accessibility</h1>
      <p style={{ color: '#a0a0a0', marginBottom: 16 }}>Share temporary obstacles and accessibility info.</p>
      {error && <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#1f3b29', color: '#b0ffcb', padding: 10, borderRadius: 8, marginBottom: 12 }}>{success}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Issue Type</span>
          <select value={form.issueType} onChange={(e)=> setForm(f=>({...f, issueType: e.target.value}))} style={{ padding: 10, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #2a2a2a' }}>
            <option value="construction">Construction</option>
            <option value="roadblock">Roadblock</option>
            <option value="elevator_outage">Elevator outage</option>
            <option value="ramp_blocked">Ramp blocked</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Status</span>
          <select value={form.status} onChange={(e)=> setForm(f=>({...f, status: e.target.value}))} style={{ padding: 10, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #2a2a2a' }}>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Description</span>
          <textarea value={form.description} onChange={(e)=> setForm(f=>({...f, description: e.target.value}))} rows={4} placeholder="Describe the obstacle or accessibility details..." style={{ padding: 10, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #2a2a2a' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.wheelchairFriendly} onChange={(e)=> setForm(f=>({...f, wheelchairFriendly: e.target.checked}))} /> Wheelchair friendly
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.hasRamp} onChange={(e)=> setForm(f=>({...f, hasRamp: e.target.checked}))} /> Has ramp
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.hasElevator} onChange={(e)=> setForm(f=>({...f, hasElevator: e.target.checked}))} /> Has elevator
          </label>
        </div>
        <button disabled={submitting} type="submit" style={{ background: '#FF6700', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }}>
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
