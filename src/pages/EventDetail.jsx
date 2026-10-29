import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDate } from '../data/events';
import './EventDetail.css';

export default function EventDetail() {
  const { id } = useParams();
  const { allEvents } = useApp();
  const navigate = useNavigate();

  const event = allEvents.find(e => e.id === id);

  if (!event) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <div className="empty-state">
          <h3>Event not found</h3>
          <p>This event may have been removed or the link is incorrect.</p>
          <Link to="/" className="btn btn-primary">Back to Events</Link>
        </div>
      </div>
    );
  }

  const minTicketPrice = Math.min(...event.tickets.map(t => t.price));

  return (
    <div className="event-detail fade-up">
      {/* Cinematic banner */}
      <div className="event-detail__banner" style={{ background: event.gradient }}>
        <div className="event-detail__banner-overlay" />
        <div className="container event-detail__banner-inner">
          <button className="event-detail__back" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <div className="event-detail__banner-content">
            <p className="event-detail__banner-category">{event.category}</p>
            <h1 className="event-detail__title">{event.title}</h1>
            <div className="event-detail__banner-meta">
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {formatDate(event.date)}
              </span>
              <span className="event-detail__banner-sep">·</span>
              <span>{event.time} – {event.endTime}</span>
              <span className="event-detail__banner-sep">·</span>
              <span>{event.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container event-detail__body">
        <div className="event-detail__layout">

          {/* Main */}
          <div className="event-detail__main">
            <div className="event-detail__info-row">
              <div className="event-detail__info-item">
                <div className="event-detail__info-label">Venue</div>
                <div className="event-detail__info-value">{event.venue}</div>
                <div className="event-detail__info-sub">{event.address}</div>
              </div>
              <div className="event-detail__info-item">
                <div className="event-detail__info-label">Organised by</div>
                <div className="event-detail__info-value">{event.organizer}</div>
                <div className="event-detail__info-sub">{event.organizerContact}</div>
              </div>
              <div className="event-detail__info-item">
                <div className="event-detail__info-label">Interest</div>
                <div className="event-detail__info-value">{event.attendees.toLocaleString('en-IN')} going</div>
              </div>
            </div>

            {event.tags?.length > 0 && (
              <div className="event-detail__tags">
                {event.tags.map(tag => (
                  <span key={tag} className="event-detail__tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="divider" />

            <h2 className="event-detail__section-title">About</h2>
            <div className="event-detail__description">
              {(event.longDescription || event.description || '').split('\n').map((para, i) =>
                para ? <p key={i}>{para}</p> : <br key={i} />
              )}
            </div>
          </div>

          {/* Tickets sidebar */}
          <aside className="event-detail__sidebar">
            <div className="ticket-card">
              <div className="ticket-card__header">
                <span className="ticket-card__label">Tickets</span>
                <span className="ticket-card__from">
                  {minTicketPrice === 0 ? 'Free' : `From ₹${minTicketPrice.toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="ticket-card__list">
                {event.tickets.map(ticket => (
                  <div key={ticket.id} className="ticket-type">
                    <div className="ticket-type__info">
                      <div className="ticket-type__name">{ticket.type}</div>
                      <div className="ticket-type__desc">{ticket.description}</div>
                      <div className="ticket-type__avail">{ticket.available} available</div>
                    </div>
                    <div className="ticket-type__price">
                      {ticket.price === 0
                        ? <span className="ticket-type__price--free">Free</span>
                        : `₹${ticket.price.toLocaleString('en-IN')}`
                      }
                    </div>
                  </div>
                ))}
              </div>

              <Link to={`/book/${event.id}`} className="btn btn-primary btn-full btn-lg">
                Book tickets
              </Link>

              <p className="ticket-card__secure">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Secure booking
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="event-detail__sticky">
        <div className="event-detail__sticky-inner container">
          <div>
            <div className="event-detail__sticky-name">{event.title}</div>
            <div className="event-detail__sticky-price">
              {minTicketPrice === 0 ? 'Free' : `From ₹${minTicketPrice.toLocaleString('en-IN')}`}
            </div>
          </div>
          <Link to={`/book/${event.id}`} className="btn btn-primary">Book</Link>
        </div>
      </div>
    </div>
  );
}
