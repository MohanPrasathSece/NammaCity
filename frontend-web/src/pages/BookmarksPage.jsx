import { useEffect, useState } from 'react';
import { bookmarkAPI } from '../services/api.js';
import './BookmarksPage.css';

export default function BookmarksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await bookmarkAPI.getMyBookmarks();
      const list = res.data?.data || res.data || res;
      setItems(list);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const remove = async (id) => {
    if (!confirm('Remove bookmark?')) return;
    await bookmarkAPI.removeBookmark(id);
    setItems(items.filter((b) => b.service._id !== id));
  };

  return (
    <div className="bookmarks-page">
      <h2 className="page-title">My Bookmarks</h2>
      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p>No bookmarks yet.</p>}
      <div className="bookmarks-list">
        {items.map((bk) => (
          <div key={bk._id} className="bookmark-card">
            <div className="card-header">
              <h3>{bk.service.name}</h3>
              <button onClick={() => remove(bk.service._id)}>🗑️</button>
            </div>
            <p>{bk.service.category}</p>
            <button onClick={() => location.href=`/map?focus=${bk.service._id}`}>View on Map</button>
          </div>
        ))}
      </div>
    </div>
  );
}
