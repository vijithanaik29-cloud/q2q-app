import { Link } from 'react-router-dom';
import { formatDate, getMinPrice } from '../data/events';
import './EventCard.css';

function shareEvent(e, event) {
  e.preventDefault();
  e.stopPropagation();
  const url = `${window.location.origin}/event/${event.id}`;
  if (navigator.share) {
    navigator.share({ title: event.title, url }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${event.title} — ${url}`)}`);
  }
}

export default function EventCard({ event, featured = false }) {
  const minPrice = getMinPrice(event.tickets);

  return (
    <Link
      to={`/event/${event.id}`}
      className={`event-card ${featured ? 'event-card--featured' : ''}`}
    >
      {/* Cinematic banner — title overlaid on gradient */}
      <div className="event-card__banner" style={{ background: event.gradient }}>
        <div className="event-card__overlay" />
        <div className="event-card__banner-body">
          <span className="event-card__category-label">{event.category}</span>
          <h3 className="event-card__title">{event.title}</h3>
        </div>
        {featured && <span className="event-card__featured-tag">Featured</span>}
        {event.boosted && !featured && <span className="event-card__sponsored-tag">⚡ Boosted</span>}
        {event.promoted && !featured && !event.boosted && <span className="event-card__sponsored-tag">⚡ Sponsored</span>}
      </div>

      {/* Minimal info strip */}
      <div className="event-card__strip">
        <div className="event-card__strip-left">
          <span className="event-card__date">{formatDate(event.date)}</span>
          <span className="event-card__sep">·</span>
          <span className="event-card__venue">{event.venue}</span>
        </div>
        <div className="event-card__strip-right">
          <span className={`event-card__price ${minPrice === 'Free' ? 'event-card__price--free' : ''}`}>
            {minPrice}
          </span>
          <button className="event-card__share" onClick={e => shareEvent(e, event)} aria-label="Share event">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="event-card__organiser">
        {event.organizerVerified && (
          <span className="event-card__verified">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Verified
          </span>
        )}
        <span className="event-card__organiser-name">{event.organizer}</span>
      </div>
    </Link>
  );
}
