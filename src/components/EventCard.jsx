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
    </Link>
  );
}
