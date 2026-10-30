import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import './Stories.css';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Other'];
const MAX       = 1200;
const PAGE_SIZE = 10;
const PREVIEW   = 280; // chars before "Read more"

const ADJECTIVES = [
  'Fabulous', 'Glittery', 'Sparkling', 'Dramatic', 'Extra', 'Iconic',
  'Sassy', 'Dazzling', 'Flamboyant', 'Radiant', 'Majestic', 'Fierce',
  'Legendary', 'Desi', 'Bollywood', 'Spicy', 'Chaotic', 'Magical',
  'Proud', 'Caffeinated', 'Confused', 'Nervous', 'Crying', 'Screaming',
];
const NOUNS = [
  'Peacock', 'Flamingo', 'Disco Ball', 'Samosa', 'Chai Cup', 'Saree',
  'Unicorn', 'Rainbow', 'Butterfly', 'Lotus', 'Mango', 'Gulab Jamun',
  'Sequin', 'Bangles', 'Supernova', 'Coconut', 'Auto-Rickshaw', 'Paneer',
  'Marigold', 'Kite', 'Firework', 'Moon', 'Meteor', 'Bollywood Extra',
];

function randomName() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

export default function Stories() {
  const [stories,    setStories]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore,setLoadingMore] = useState(false);
  const [content,    setContent]    = useState('');
  const [city,       setCity]       = useState('');
  const [saving,     setSaving]     = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [expanded,   setExpanded]   = useState({});  // id → true when expanded

  const loadStories = useCallback(async (offset = 0) => {
    if (offset === 0) setLoading(true); else setLoadingMore(true);

    const { data, count } = await supabase
      .from('stories')
      .select('id, content, city, author_name, created_at', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (offset === 0) {
      setStories(data || []);
    } else {
      setStories(prev => [...prev, ...(data || [])]);
    }
    setTotal(count || 0);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => { loadStories(0); }, [loadStories]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (content.trim().length < 10) { setError('Story must be at least 10 characters.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('stories').insert({
      content:     content.trim(),
      city:        city || null,
      author_name: randomName(),
    });
    setSaving(false);
    if (err) { setError('Could not submit your story. Please try again.'); return; }
    setContent('');
    setCity('');
    setSubmitted(true);
  }

  const hasMore = stories.length < total;

  return (
    <div className="stories fade-up">

      {/* ── Hero banner ── */}
      <div className="stories__banner">
        <div className="container stories__banner-inner">
          <div className="stories__banner-eyebrow">Coming Out Stories</div>
          <h1 className="stories__banner-title">Every story matters.</h1>
          <p className="stories__banner-sub">
            Real coming out moments from queer people across India — shared anonymously,
            so the next person doesn't feel so alone.
          </p>
          <div className="stories__banner-actions">
            <button className="btn btn-rainbow" onClick={() => setShowForm(v => !v)}>
              {showForm ? 'Close' : 'Share your story'}
            </button>
            {total > 0 && (
              <span className="stories__total-count">{total} {total === 1 ? 'story' : 'stories'} shared</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit form (toggled) ── */}
      {showForm && (
        <div className="stories__form-wrap">
          <div className="container">
            <div className="stories__submit">
              {submitted ? (
                <div className="stories__thanks">
                  <div className="stories__thanks-icon">🏳️‍🌈</div>
                  <strong>Thank you for sharing.</strong>
                  <p>Your story is under review and will appear here once approved — usually within 24 hours.</p>
                  <button className="stories__again-btn" onClick={() => { setSubmitted(false); setShowForm(false); }}>Done</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <label className="stories__label">Your coming out story</label>
                  <textarea
                    className="stories__textarea"
                    placeholder="How did you come out? What happened? How did it feel? There's no right way to tell it — write as much or as little as you want…"
                    value={content}
                    onChange={e => setContent(e.target.value.slice(0, MAX))}
                    rows={7}
                  />
                  <div className="stories__textarea-meta">
                    <select className="stories__city-select" value={city} onChange={e => setCity(e.target.value)}>
                      <option value="">City (optional)</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="stories__char-count" style={{ color: content.length > MAX - 100 ? 'var(--error)' : 'var(--text-muted)' }}>
                      {content.length}/{MAX}
                    </span>
                  </div>
                  {error && <div className="stories__error">{error}</div>}
                  <button className="btn btn-rainbow btn-full" type="submit" disabled={saving || !content.trim()}>
                    {saving ? 'Submitting…' : 'Submit anonymously'}
                  </button>
                  <p className="stories__disclaimer">No name or email is stored. Stories are reviewed before publishing.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Blog feed ── */}
      <div className="container">
        <div className="stories__blog">

          {loading ? (
            <div className="stories__loading">Loading stories…</div>
          ) : stories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🏳️‍🌈</div>
              <h3>No stories yet</h3>
              <p>Be the first to share yours.</p>
            </div>
          ) : (
            <>
              {stories.map((s, i) => {
                const isLong = s.content.length > PREVIEW;
                const isOpen = expanded[s.id];
                const text   = isLong && !isOpen ? s.content.slice(0, PREVIEW).trimEnd() + '…' : s.content;

                return (
                  <article key={s.id} className="stories__post">
                    <div className="stories__post-meta">
                      <span className="stories__post-author">{s.author_name || 'Anonymous'}</span>
                      {s.city && <span className="stories__post-city">{s.city}</span>}
                      <span className="stories__post-date">
                        {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <blockquote className="stories__post-body">{text}</blockquote>
                    {isLong && (
                      <button
                        className="stories__read-more"
                        onClick={() => setExpanded(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                      >
                        {isOpen ? 'Show less ↑' : 'Read full story ↓'}
                      </button>
                    )}
                    {i < stories.length - 1 && <hr className="stories__divider" />}
                  </article>
                );
              })}

              {hasMore && (
                <div className="stories__load-more">
                  <button
                    className="btn btn-outline"
                    onClick={() => loadStories(stories.length)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading…' : `Load more stories (${total - stories.length} left)`}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}
