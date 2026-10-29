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
  const [dateFilter, setDateFilter] = useState('upcoming');

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
    setDateFilter('upcoming');
    setSearch('');
  }

  function getDateRange(filter) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const todayStr = fmt(now);
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = fmt(tomorrow);
    const day = now.getDay(); // 0=Sun,6=Sat
    const daysToSat = (6 - day + 7) % 7 || 7;
    const daysToSun = (0 - day + 7) % 7 || 7;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat);
    const sun = new Date(now); sun.setDate(now.getDate() + daysToSun);
    const satStr = fmt(sat); const sunStr = fmt(sun);
    return { todayStr, tomorrowStr, satStr, sunStr };
  }

  const hasActiveFilters = selectedCity !== 'All' || selectedCategory !== 'All' ||
    priceFilter !== 'All' || dateFilter !== 'upcoming' || !!search;

  const featuredEvents = useMemo(() =>
    allEvents.filter(e => e.featured), [allEvents]);

  const filteredEvents = useMemo(() => {
    const { todayStr, tomorrowStr, satStr, sunStr } = getDateRange(dateFilter);
    const filtered = allEvents.filter(e => {
      const matchCity = selectedCity === 'All' || e.city === selectedCity;
      const matchCat = selectedCategory === 'All' || e.category === selectedCategory;
      const matchSearch = !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase());
      const minPrice = Math.min(...(e.tickets || []).map(t => t.price ?? 0));
      const matchPrice = priceFilter === 'All' ||
        (priceFilter === 'Free' && minPrice === 0) ||
        (priceFilter === 'Paid' && minPrice > 0);
      const matchDate = dateFilter === 'all' ? true :
        dateFilter === 'upcoming' ? e.date >= todayStr :
        dateFilter === 'today' ? e.date === todayStr :
        dateFilter === 'tomorrow' ? e.date === tomorrowStr :
        dateFilter === 'weekend' ? (e.date === satStr || e.date === sunStr) : true;
      return matchCity && matchCat && matchSearch && matchPrice && matchDate;
    });
    // Promoted events float to top
    return filtered.sort((a, b) => (b.promoted ? 1 : 0) - (a.promoted ? 1 : 0));
  }, [allEvents, selectedCity, selectedCategory, search, priceFilter, dateFilter]);

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
            Parties, pride marches, film festivals, workshops, and more,
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

          {/* Date quick filter */}
          <div className="filters__row filters__row--date">
            {[
              { key: 'today',    label: 'Today' },
              { key: 'tomorrow', label: 'Tomorrow' },
              { key: 'weekend',  label: 'Weekend' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'all',      label: 'All' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`date-pill ${dateFilter === key ? 'date-pill--active' : ''}`}
                onClick={() => setDateFilter(key)}
              >
                {label}
              </button>
            ))}
            {hasActiveFilters && (
              <button className="date-pill date-pill--clear" onClick={clearAllFilters}>✕ Clear</button>
            )}
          </div>

          {/* Cities */}
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

          {/* Categories + price */}
          <div className="filters__row filters__row--cats">
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
            <span className="filters__sep" />
            {['Free', 'Paid'].map(p => (
              <button
                key={p}
                className={`cat-pill ${priceFilter === p ? 'cat-pill--active' : ''}`}
                onClick={() => setPriceFilter(prev => prev === p ? 'All' : p)}
              >
                {p === 'Free' ? '🎟️ Free' : '💳 Paid'}
              </button>
            ))}
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
              <div className="empty-state__icon">·</div>
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
            <p className="cta-band__sub">List it on Q2Q and reach thousands across India. Free to submit.</p>
          </div>
          <a href="/admin" className="btn btn-rainbow btn-lg">Submit your event</a>
        </div>
      </section>
    </div>
  );
}
