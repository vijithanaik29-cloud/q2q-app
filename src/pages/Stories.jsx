import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Stories.css';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Other'];
const MAX = 600;

export default function Stories() {
  const [stories,   setStories]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [content,   setContent]   = useState('');
  const [city,      setCity]      = useState('');
  const [saving,    setSaving]    = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    setLoading(true);
    const { data } = await supabase
      .from('stories')
      .select('id, content, city, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    setStories(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (content.trim().length < 10) { setError('Story must be at least 10 characters.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('stories').insert({
      content: content.trim(),
      city:    city || null,
    });
    setSaving(false);
    if (err) { setError('Could not submit your story. Please try again.'); return; }
    setContent('');
    setCity('');
    setSubmitted(true);
  }

  return (
    <div className="stories fade-up">
      <div className="container">

        {/* Hero */}
        <div className="stories__hero">
          <div className="stories__hero-eyebrow">Community</div>
          <h1 className="stories__hero-title">Q2Q Stories</h1>
          <p className="stories__hero-sub">
            Real moments from India's queer community — shared anonymously, celebrated together.
            No names, no judgement. Just your truth.
          </p>
        </div>

        {/* Submit form */}
        <div className="stories__submit">
          <h2 className="stories__submit-title">Share your story</h2>
          {submitted ? (
            <div className="stories__thanks">
              <div className="stories__thanks-icon">🏳️‍🌈</div>
              <strong>Thank you for sharing.</strong>
              <p>Your story is under review and will appear here once approved — usually within 24 hours.</p>
              <button className="stories__again-btn" onClick={() => setSubmitted(false)}>Share another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <textarea
                className="stories__textarea"
                placeholder="Something happened at an event, or in your life as a queer person in India, that you want the community to know about…"
                value={content}
                onChange={e => setContent(e.target.value.slice(0, MAX))}
                rows={5}
              />
              <div className="stories__textarea-meta">
                <select
                  className="stories__city-select"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                >
                  <option value="">City (optional)</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="stories__char-count" style={{ color: content.length > MAX - 50 ? 'var(--error)' : 'var(--text-muted)' }}>
                  {content.length}/{MAX}
                </span>
              </div>
              {error && <div className="stories__error">{error}</div>}
              <button className="btn btn-rainbow btn-full" type="submit" disabled={saving || !content.trim()}>
                {saving ? 'Submitting…' : 'Submit anonymously'}
              </button>
              <p className="stories__disclaimer">
                No name or email is stored. Stories are reviewed before publishing.
              </p>
            </form>
          )}
        </div>

        {/* Story feed */}
        <div className="stories__feed-header">
          <h2>From the community</h2>
          {!loading && <span className="stories__count">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>}
        </div>

        {loading ? (
          <div className="stories__loading">Loading stories…</div>
        ) : stories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">✍️</div>
            <h3>No stories yet</h3>
            <p>Be the first to share yours.</p>
          </div>
        ) : (
          <div className="stories__grid">
            {stories.map(s => (
              <div key={s.id} className="stories__card">
                <p className="stories__card-text">"{s.content}"</p>
                <div className="stories__card-meta">
                  {s.city && <span className="stories__card-city">{s.city}</span>}
                  <span className="stories__card-date">
                    {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
