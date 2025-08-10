import { useEffect, useState } from 'react';
import { journalAPI } from '../services/api.js';
import './JournalPage.css';
import '../styles/Page.css';

const moods = ['😄', '🙂', '😐', '🙁', '😢', '😡', '🤩'];

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [mood, setMood] = useState('🙂');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    const res = await journalAPI.getEntries?.() || (await journalAPI.getMyJournals?.()) || await journalAPI.getMyJournals();
    setEntries(res.data || res);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSave = async () => {
    if (!content.trim()) return alert('Please write something.');
    setLoading(true);
    await journalAPI.createEntry?.({ mood, title, content }) || journalAPI.createJournal({ mood, title, content });
    setContent('');
    setTitle('');
    setMood('🙂');
    await fetchEntries();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete entry?')) return;
    await journalAPI.deleteEntry?.(id) || journalAPI.deleteJournal(id);
    setEntries(entries.filter((e) => e._id !== id));
  };

  return (
    <div className="journal-page page-container">
      <h2 className="page-title">My Journal</h2>

      <div className="journal-form">
        <div className="mood-picker">
          {moods.map((m) => (
            <button
              key={m}
              className={`mood-btn ${m === mood ? 'selected' : ''}`}
              onClick={() => setMood(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />

        <textarea
          rows="4"
          placeholder="How was your day?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="content-textarea"
        />

        <button className="save-btn" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <h3 className="section-title">Past Entries</h3>
      <div className="entries-list">
        {entries.map((entry) => (
          <div key={entry._id} className="entry-card">
            <div className="entry-header">
              <span className="entry-mood">{entry.mood}</span>
              <span className="entry-date">{new Date(entry.createdAt).toLocaleDateString()}</span>
              <button className="delete-btn" onClick={() => handleDelete(entry._id)}>🗑️</button>
            </div>
            {entry.title && <h4 className="entry-title">{entry.title}</h4>}
            <p className="entry-content">{entry.content}</p>
          </div>
        ))}
        {entries.length === 0 && <p>No entries yet.</p>}
      </div>
    </div>
  );
}
