import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import EventCard from '../components/EventCard';
import { CITIES, CATEGORIES } from '../data/events';
import './Home.css';

export default function Home() {
  const { allEvents } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const selectedCity = searchParams.get('city') || 'All';

  function setCity(city) {
    if (city === 'All') searchParams.delete('city');
    else searchParams.set('city', city);
    setSearchParams(searchParams, { replace: true });
  }

  const featuredEvents = useMemo(() =>
    allEvents.filter(e => e.featured), [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const matchCity = selectedCity === 'All' || e.city === selectedCity;
      const matchCat = selectedCategory === 'All' || e.category === selectedCategory;
      const matchSearch = !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase());
      return matchCity && matchCat && matchSearch;
    });
  }, [allEvents, selectedCity, selectedCategory, search]);

  const noFilters = selectedCity === 'All' && selectedCategory === 'All' && !search;

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
          <div className="filters__row">
            {CITIES.map(city => (
              <button
                key={city}
                className={`filter-pill ${selectedCity === city ? 'filter-pill--active' : ''}`}
                onClick={() => setCity(city)}
              >
                {city}
              </button>
            ))}
          </div>
          <div className="filters__row filters__row--cats">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                className={`filter-pill filter-pill--sm ${selectedCategory === cat ? 'filter-pill--active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
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
