import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation as useLocationContext } from '../context/LocationContext.jsx';
import { issueAPI } from '../services/api';

const ISSUE_TYPES = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'street-light', label: 'Broken Street Light' },
  { value: 'water-logging', label: 'Water Logging' },
  { value: 'other', label: 'Other' },
];

export default function ReportIssue() {
  const navigate = useNavigate();
  const { userLocation, getCurrentLocation, isLocationLoading } = useLocationContext();

  const [form, setForm] = useState({
    issueType: 'pothole',
    description: '',
    photoUrl: '', // MVP: URL. Next step: file upload to server or cloud storage.
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userLocation) {
      setError('Location not available. Please allow location access.');
      return;
    }

    if (!form.photoUrl) {
      setError('Please provide a photo URL for verification.');
      return;
    }

    const payload = {
      issueType: form.issueType,
      description: form.description,
      photoUrl: form.photoUrl,
      location: {
        type: 'Point',
        coordinates: [userLocation.lng, userLocation.lat],
      },
    };

    try {
      setSubmitting(true);
      await issueAPI.create(payload);
      setSuccess('Issue reported successfully!');
      setTimeout(() => navigate('/home'), 1000);
    } catch (err) {
      setError(err.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '16px', color: '#fff', background: '#0A0A0A', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Report Civic Issue</h1>
      <p style={{ color: '#a0a0a0', marginBottom: 16 }}>Help improve the city by reporting problems you notice.</p>

      <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#a0a0a0', fontSize: 12 }}>Your Location</div>
            <div style={{ fontSize: 14 }}>
              {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : 'Not available'}
            </div>
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={isLocationLoading}
            style={{
              background: '#FF6700',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            {isLocationLoading ? 'Updating…' : 'Use Current Location'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Issue Type</label>
        <select
          name="issueType"
          value={form.issueType}
          onChange={handleChange}
          style={{ width: '100%', padding: 12, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #333', marginBottom: 16 }}
        >
          {ISSUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Briefly describe the issue and its exact spot"
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #333', marginBottom: 16 }}
        />

        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Photo URL</label>
        <input
          name="photoUrl"
          value={form.photoUrl}
          onChange={handleChange}
          placeholder="https://…"
          style={{ width: '100%', padding: 12, borderRadius: 8, background: '#1A1A1A', color: '#fff', border: '1px solid #333', marginBottom: 16 }}
        />

        {error && (
          <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>
        )}
        {success && (
          <div style={{ background: '#1f3b21', color: '#b7ffb7', padding: 10, borderRadius: 8, marginBottom: 12 }}>{success}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            background: '#FF6700',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
