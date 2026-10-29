import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import EventCard from '../components/EventCard';
import { CITIES, CATEGORIES, CATEGORY_EMOJI } from '../data/events';
import './Home.css';

const CITY_EMOJI = {
  All: '🗺️', Mumbai: '🌊', Delhi: '🏛️', Bangalore: '💻',
  Chennai: '🎭', Kolkata: '🌸', Hyderabad: '🕌', Pune: '🎓', Goa: '🏖️',
};

function lsGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function lsSet(key, val) { try { if (val) localStorage.setItem(key, val); else localStorage.removeItem(key); } catch (_) {} }

export default function Home() {
  const { allEvents } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const saved = lsGet('q2q_cat_pref');
    return saved && CATEGORIES.includes(saved) ? saved : 'All';
  });
  const [priceFilter, setPriceFilter] = useState('All');
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  const selectedCity = searchParams.get('city') || 'All';

  // Restore saved city preference on first load if no URL param
  useEffect(() => {
    if (!searchParams.get('city')) {
      const saved = lsGet('q2q_city_pref');
      if (saved && CITIES.includes(saved) && saved !== 'All') {
        const next = new URLSearchParams(searchParams);
        next.set('city', saved);
        setSearchParams(next, { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setCity(city) {
    if (city === 'All') { searchParams.delete('city'); lsSet('q2q_city_pref', null); }
    else { searchParams.set('city', city); lsSet('q2q_city_pref', city); }
    setSearchParams(searchParams, { replace: true });
  }

  function setCategory(cat) {
    setSelectedCategory(cat);
    lsSet('q2q_cat_pref', cat === 'All' ? null : cat);
  }

  function clearAllFilters() {
    setCity('All');
    setCategory('All');
    setPriceFilter('All');
    setUpcomingOnly(false);
    setSearch('');
  }

  const today = new Date().toISOString().slice(0, 10);

  const hasActiveFilters = selectedCity !== 'All' || selectedCategory !== 'All' ||
    priceFilter !== 'All' || upcomingOnly || !!search;

  const featuredEvents = useMemo(() =>
    allEvents.filter(e => e.featured), [allEvents]);

  const filteredEvents = useMemo(() => {
    const filtered = allEvents.filter(e => {
      const matchCity = selectedCity === 'All' || e.city === selectedCity;
      const matchCat = selectedCategory === 'All' || e.category === selectedCategory;
      const matchSearch = !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase());
      const matchUpcoming = !upcomingOnly || e.date >= today;
      const minPrice = Math.min(...(e.tickets || []).map(t => t.price ?? 0));
      const matchPrice = priceFilter === 'All' ||
        (priceFilter === 'Free' && minPrice === 0) ||
        (priceFilter === 'Paid' && minPrice > 0);
      return matchCity && matchCat && matchSearch && matchUpcoming && matchPrice;
    });
    // Promoted events float to top
    return filtered.sort((a, b) => (b.promoted ? 1 : 0) - (a.promoted ? 1 : 0));
  }, [allEvents, selectedCity, selectedCategory, search, upcomingOnly, priceFilter, today]);

  const noFilters = !hasActiveFilters;

  return (
    <div className="home fade-up">
      {/* Hero */}
      <section className="hero">
        <div className="container hero__inner">
          <p className="hero__eyebrow">India's Queer Events</p>
          <h1 className="hero__title">
            Find your<br />
            <em className="rainbow-text">queer community</em>
          </h1>
          <p className="hero__subtitle">
            Parties, pride marches, film festivals, workshops, and more —
            across Mumbai, Delhi, Bangalore, and beyond.
          </p>
          <div className="hero__search-wrap">
            <svg className="hero__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search events, venues, cities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="hero__search"
            />
            {search && (
              <button className="hero__search-clear" onClick={() => setSearch('')} aria-label="Clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="filters">
        <div className="container">

          {/* Cities */}
          <div className="filters__section">
            <div className="filters__label-row">
              <span className="filters__label">Where</span>
            </div>
            <div className="filters__row">
              {CITIES.map(city => (
                <button
                  key={city}
                  className={`city-pill ${selectedCity === city ? 'city-pill--active' : ''}`}
                  onClick={() => setCity(city)}
                >
                  <span className="city-pill__emoji">{CITY_EMOJI[city]}</span>
                  <span className="city-pill__name">{city === 'All' ? 'All Cities' : city}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories + Quick filters */}
          <div className="filters__section filters__section--bottom">
            <div className="filters__label-row">
              <span className="filters__label">What</span>
              <div className="filters__quick">
                <button
                  className={`quick-pill ${upcomingOnly ? 'quick-pill--active' : ''}`}
                  onClick={() => setUpcomingOnly(v => !v)}
                >
                  📅 Upcoming
                </button>
                {['All', 'Free', 'Paid'].map(p => (
                  <button
                    key={p}
                    className={`quick-pill ${priceFilter === p ? 'quick-pill--active' : ''}`}
                    onClick={() => setPriceFilter(p)}
                  >
                    {p === 'Free' ? '🎟️ Free' : p === 'Paid' ? '💳 Paid' : '💸 All'}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button className="quick-pill quick-pill--clear" onClick={clearAllFilters}>
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
            <div className="filters__row">
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  className={`cat-pill ${selectedCategory === cat ? 'cat-pill--active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat !== 'All' && <span className="cat-pill__emoji">{CATEGORY_EMOJI[cat]}</span>}
                  {cat === 'All' ? '✦ All' : cat}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Featured */}
      {noFilters && featuredEvents.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-header__title">Featured</h2>
              <span className="section-header__count">{featuredEvents.length} events</span>
            </div>
            <div className="events-grid events-grid--featured">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All events */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-header__title">
              {selectedCity !== 'All' ? `${selectedCity}` :
               selectedCategory !== 'All' ? selectedCategory :
               search ? `"${search}"` : 'All Events'}
            </h2>
            <span className="section-header__count">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">—</div>
              <h3>No events found</h3>
              <p>Try a different city, category, or search term.</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { setCity('All'); setSelectedCategory('All'); setSearch(''); }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Organiser CTA */}
      <section className="cta-band">
        <div className="container cta-band__inner">
          <div className="cta-band__text">
            <p className="cta-band__eyebrow">For Organisers</p>
            <h2 className="cta-band__title">Running a queer event?</h2>
            <p className="cta-band__sub">List it on Q2Q and reach thousands across India — free to submit.</p>
          </div>
          <a href="/admin" className="btn btn-rainbow btn-lg">Submit your event</a>
        </div>
      </section>
    </div>
  );
}
