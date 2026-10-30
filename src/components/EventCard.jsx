import { Link } from 'react-router-dom';
import { formatDate, getMinPrice } from '../data/events';
import './EventCard.css';

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
        <span className={`event-card__price ${minPrice === 'Free' ? 'event-card__price--free' : ''}`}>
          {minPrice}
        </span>
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
