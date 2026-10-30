import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDate } from '../data/events';
import './EventDetail.css';

export default function EventDetail() {
  const { id } = useParams();
  const { allEvents } = useApp();
  const navigate = useNavigate();
  const [tcOpen, setTcOpen] = useState(false);

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
                <div className="event-detail__info-value">
                  {event.organizer}
                  {event.organizerVerified && (
                    <span className="event-detail__verified-badge">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Verified · {event.organizerHostedCount} events
                    </span>
                  )}
                </div>
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

            <div className="divider" />

            {/* Terms & Conditions */}
            <button
              className="event-detail__tc-toggle"
              onClick={() => setTcOpen(o => !o)}
              aria-expanded={tcOpen}
            >
              <span>Terms &amp; Conditions</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: tcOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {tcOpen && (
              <div className="event-detail__tc-body">
                <ol className="event-detail__tc-list">
                  <li>Tickets once booked cannot be exchanged or refunded, except in the event of cancellation by the organiser.</li>
                  <li>The booking fee is included in the price shown. No additional charges will be applied at checkout.</li>
                  <li>Tickets are personal and non-transferable. Resale or transfer of tickets is not permitted without the organiser's written consent.</li>
                  <li>We recommend arriving at least 15 minutes before the event starts to allow for check-in.</li>
                  <li>Rights of admission are reserved. The organiser may refuse entry to any attendee who does not comply with the event's rules or safe space guidelines.</li>
                  <li>This event is independently organised and managed by <strong>{event.organizer}</strong>. Q2Q is a ticketing platform only and is not responsible for any changes, cancellations, or issues with the event.</li>
                  <li>Q2Q is committed to being a safe, inclusive platform. Any attendee engaging in harassment or discrimination may have their booking cancelled without a refund.</li>
                </ol>
                <p className="event-detail__tc-privacy">
                  Privacy notice · By booking, you agree to Q2Q's <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms of Service</Link>.
                </p>
              </div>
            )}
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
