import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './Stories.css';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Other'];
const MAX       = 1200;
const PAGE_SIZE = 6;
const PREVIEW   = 280; // chars before "Read more"

const IDENTITY_TAGS = [
  { id: 'gay',        label: '🏳️‍🌈 Gay' },
  { id: 'lesbian',    label: '🏳️‍🌈 Lesbian' },
  { id: 'bisexual',   label: '🏳️‍🌈 Bisexual' },
  { id: 'trans',      label: '🏳️‍⚧️ Trans' },
  { id: 'non-binary', label: 'Non-Binary' },
  { id: 'queer',      label: '🌈 Queer' },
  { id: 'pansexual',  label: '💜 Pan' },
  { id: 'asexual',    label: '🖤 Ace' },
  { id: 'questioning',label: 'Questioning' },
  { id: 'intersex',   label: 'Intersex' },
];

const PERSPECTIVE_TAGS = [
  { id: 'dont-care',   label: "I don't care 🤍" },
  { id: 'my-brother',  label: 'My bro came out' },
  { id: 'my-sister',   label: 'My sis came out' },
  { id: 'my-friend',   label: 'My friend came out' },
  { id: 'my-son',      label: 'My son came out' },
  { id: 'my-daughter', label: 'My daughter came out' },
  { id: 'my-husband',  label: 'My husband came out' },
  { id: 'my-wife',     label: 'My wife came out' },
];

const TAGS = [...IDENTITY_TAGS, ...PERSPECTIVE_TAGS];

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
  const [stories,      setStories]      = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [content,      setContent]      = useState('');
  const [city,         setCity]         = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTag,    setActiveTag]    = useState('');
  const [saving,       setSaving]       = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [expanded,     setExpanded]     = useState({});
  const [filterOpen,   setFilterOpen]   = useState(false);
  const feedRef    = useRef(null);
  const filterRef  = useRef(null);

  const loadStories = useCallback(async (pg = 1, tag = '') => {
    setLoading(true);
    const from = (pg - 1) * PAGE_SIZE;
    const to   = pg * PAGE_SIZE - 1;

    let q = supabase
      .from('stories')
      .select('id, content, city, author_name, views, tags, created_at', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (tag) q = q.contains('tags', [tag]);

    const { data, count } = await q;
    const newStories = data || [];
    setStories(newStories);
    setTotal(count || 0);
    setLoading(false);

    // Increment view counts once per session per story
    try {
      const seen = JSON.parse(sessionStorage.getItem('q2q_seen_stories') || '[]');
      const unseen = newStories.filter(s => !seen.includes(s.id));
      if (unseen.length > 0) {
        unseen.forEach(s => supabase.rpc('increment_story_views', { story_id: s.id }));
        sessionStorage.setItem('q2q_seen_stories', JSON.stringify([...seen, ...unseen.map(s => s.id)]));
      }
    } catch (_) {}
  }, []);

  useEffect(() => { loadStories(page, activeTag); }, [loadStories, page, activeTag]);

  useEffect(() => {
    function onClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handlePageChange(newPage) {
    setPage(newPage);
    setExpanded({});
    feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleTagFilter(tag) {
    setActiveTag(prev => prev === tag ? '' : tag);
    setPage(1);
    setExpanded({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (content.trim().length < 10) { setError('Story must be at least 10 characters.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('stories').insert({
      content:     content.trim(),
      city:        city || null,
      author_name: randomName(),
      tags:        selectedTags,
    });
    setSaving(false);
    if (err) { setError('Could not submit your story. Please try again.'); return; }
    setContent('');
    setCity('');
    setSelectedTags([]);
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
                  <div className="stories__tag-picker">
                    <span className="stories__tag-picker-label">Tags (optional, pick up to 3)</span>
                    <p className="stories__tag-group-label">Your identity</p>
                    <div className="stories__tag-chips">
                      {IDENTITY_TAGS.map(t => {
                        const active = selectedTags.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`stories__tag-chip${active ? ' stories__tag-chip--active' : ''}`}
                            onClick={() => setSelectedTags(prev =>
                              active ? prev.filter(x => x !== t.id)
                                     : prev.length < 3 ? [...prev, t.id] : prev
                            )}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="stories__tag-group-label" style={{ marginTop: 12 }}>Someone came out to you?</p>
                    <div className="stories__tag-chips">
                      {PERSPECTIVE_TAGS.map(t => {
                        const active = selectedTags.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`stories__tag-chip${active ? ' stories__tag-chip--active' : ''}`}
                            onClick={() => setSelectedTags(prev =>
                              active ? prev.filter(x => x !== t.id)
                                     : prev.length < 3 ? [...prev, t.id] : prev
                            )}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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

      {/* ── Filter bar ── */}
      <div className="stories__filter-bar">
        <div className="container">
          <div className="stories__filter-row">
            <div className="stories__filter-dropdown" ref={filterRef}>
              <button
                className={`stories__filter-btn${activeTag ? ' stories__filter-btn--active' : ''}`}
                onClick={() => setFilterOpen(v => !v)}
                aria-expanded={filterOpen}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                {activeTag ? (TAGS.find(t => t.id === activeTag)?.label ?? 'Filter') : 'Filter'}
                {activeTag && (
                  <span
                    className="stories__filter-clear"
                    role="button"
                    aria-label="Clear filter"
                    onClick={e => { e.stopPropagation(); handleTagFilter(''); }}
                  >×</span>
                )}
              </button>

              {filterOpen && (
                <div className="stories__filter-panel">
                  <p className="stories__filter-group-label">Identity</p>
                  <div className="stories__filter-options">
                    {IDENTITY_TAGS.map(t => (
                      <button
                        key={t.id}
                        className={`stories__filter-option${activeTag === t.id ? ' stories__filter-option--active' : ''}`}
                        onClick={() => { handleTagFilter(t.id); setFilterOpen(false); }}
                      >{t.label}</button>
                    ))}
                  </div>
                  <p className="stories__filter-group-label" style={{ marginTop: 16 }}>Someone came out to you?</p>
                  <div className="stories__filter-options">
                    {PERSPECTIVE_TAGS.map(t => (
                      <button
                        key={t.id}
                        className={`stories__filter-option${activeTag === t.id ? ' stories__filter-option--active' : ''}`}
                        onClick={() => { handleTagFilter(t.id); setFilterOpen(false); }}
                      >{t.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {activeTag && (
              <span className="stories__filter-active-label">
                Showing: <strong>{TAGS.find(t => t.id === activeTag)?.label}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Blog feed ── */}
      <div className="container">
        <div className="stories__blog" ref={feedRef}>

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
                    <div className="stories__post-num">#{String((page - 1) * PAGE_SIZE + i + 1).padStart(2, '0')}</div>
                    <div className="stories__post-content">
                      <div className="stories__post-meta">
                        <span className="stories__post-author">{s.author_name || 'Anonymous'}</span>
                        {s.city && <span className="stories__post-city">{s.city}</span>}
                        {s.views > 0 && (
                          <span className="stories__post-views">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            {s.views}
                          </span>
                        )}
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
                    </div>
                    {i < stories.length - 1 && <hr className="stories__divider" />}
                  </article>
                );
              })}

              {totalPages > 1 && (
                <div className="stories__pagination">
                  <button
                    className="stories__page-btn stories__page-btn--nav"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >←</button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`stories__page-btn${p === page ? ' stories__page-btn--active' : ''}`}
                      onClick={() => handlePageChange(p)}
                    >{p}</button>
                  ))}

                  <button
                    className="stories__page-btn stories__page-btn--nav"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >→</button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}
