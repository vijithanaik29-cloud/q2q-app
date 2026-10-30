import { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { formatDate } from '../data/events';
import RainbowCelebration from '../components/RainbowCelebration';
import './Confirmation.css';

export default function Confirmation() {
  const { state } = useLocation();
  const [celebrated, setCelebrated] = useState(false);

  if (!state?.booking) return <Navigate to="/" replace />;

  const { booking } = state;

  return (
    <>
      {!celebrated && <RainbowCelebration onDone={() => setCelebrated(true)} />}
    <div className="confirmation fade-up">
      <div className="container confirmation__inner">
        {/* Success header */}
        <div className="confirmation__header">
          <div className="confirmation__success-ring">
            <div className="confirmation__checkmark">✓</div>
          </div>
          <h1>You're going! 🎉</h1>
          <p>Booking confirmed. Your tickets have been sent to <strong>{booking.attendee.email}</strong></p>
        </div>

        {/* Booking card */}
        <div className="confirmation__card card">
          {/* Banner */}
          <div className="confirmation__card-banner" style={{ background: booking.gradient }}>
            <div className="confirmation__ref">
              <span className="confirmation__ref-label">Booking Reference</span>
              <span className="confirmation__ref-num">{booking.id}</span>
            </div>
          </div>

          <div className="confirmation__card-body">
            <h2 className="confirmation__event-title">{booking.eventTitle}</h2>

            <div className="confirmation__details">
              <div className="confirmation__detail-item">
                <div className="confirmation__detail-label">Date & Time</div>
                <div className="confirmation__detail-value">{formatDate(booking.eventDate)}</div>
              </div>
              <div className="confirmation__detail-item">
                <div className="confirmation__detail-label">Venue</div>
                <div className="confirmation__detail-value">{booking.eventVenue}, {booking.eventCity}</div>
              </div>
              <div className="confirmation__detail-item">
                <div className="confirmation__detail-label">Attendee</div>
                <div className="confirmation__detail-value">{booking.attendee.name}</div>
              </div>
            </div>

            <div className="divider" />

            {/* Tickets */}
            <div className="confirmation__tickets">
              {booking.tickets.map((t, i) => (
                <div key={i} className="confirmation__ticket">
                  <div>
                    <div className="confirmation__ticket-type">{t.type}</div>
                    <div className="confirmation__ticket-qty">× {t.qty}</div>
                  </div>
                  <div className="confirmation__ticket-price">
                    {t.price === 0 ? 'Free' : `₹${(t.price * t.qty).toLocaleString('en-IN')}`}
                  </div>
                </div>
              ))}
              <div className="confirmation__total">
                <span>Total paid</span>
                <strong>{booking.total === 0 ? 'Free' : `₹${booking.total.toLocaleString('en-IN')}`}</strong>
              </div>
            </div>

            {/* QR placeholder */}
            <div className="confirmation__qr-section">
              <div className="confirmation__qr" aria-label="Ticket QR code">
                <div className="confirmation__qr-grid">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="confirmation__qr-cell" style={{
                      background: ((i * 7 + Math.floor(i / 8) * 3) % 3 === 0) ? '#111' : 'transparent',
                    }} />
                  ))}
                </div>
              </div>
              <p className="confirmation__qr-hint">Show this at the venue entrance</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="confirmation__actions">
          <button
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Save / Print Ticket
          </button>
          <Link to="/" className="btn btn-primary">Explore More Events</Link>
        </div>

        <p className="confirmation__note">
          A confirmation email has been sent to {booking.attendee.email}. If you don't see it, check your spam folder.
        </p>
      </div>
    </div>
    </>
  );
}
