import React, { useEffect, useState } from 'react';
import { issueAPI } from '../services/api';

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await issueAPI.getAll({ limit: 50 });
        // advancedResults returns { success, count, pagination, data }
        setIssues(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openInGoogleMaps = (issue) => {
    const [lng, lat] = issue.location?.coordinates || [];
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: 16, color: '#fff', background: '#0A0A0A', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Reported Civic Issues</h1>
      <p style={{ color: '#a0a0a0', marginBottom: 16 }}>Browse issues reported by the community.</p>

      {loading && <div>Loading…</div>}
      {error && <div style={{ background: '#3b1f1f', color: '#ffb0b0', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      {!loading && !error && issues.length === 0 && (
        <div style={{ color: '#a0a0a0' }}>No issues reported yet.</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {issues.map((issue) => (
          <div key={issue._id} style={{ background: '#1A1A1A', borderRadius: 12, padding: 12, border: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4, textTransform: 'capitalize' }}>{issue.issueType?.replace('-', ' ')}</div>
                <div style={{ color: '#cfcfcf', fontSize: 14, marginBottom: 6 }}>{issue.description}</div>
                <div style={{ color: '#8e8e93', fontSize: 12 }}>Status: {issue.status || 'reported'}</div>
              </div>
              {issue.photoUrl && (
                <img src={issue.photoUrl} alt={issue.issueType} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8 }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => openInGoogleMaps(issue)}
                style={{ background: '#FF6700', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}
              >
                Open in Maps
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
