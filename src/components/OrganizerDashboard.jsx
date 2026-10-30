import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../data/events';
import QRVerifier from './QRVerifier';
import './OrganizerDashboard.css';

const PLATFORM_FEE_RATE = 0.10;

export default function OrganizerDashboard({ event, onBack }) {
  const { bookings, checkedIn, checkIn } = useApp();
  const [activeTab, setActiveTab] = useState('attendees');
  const [search, setSearch] = useState('');

  const eventBookings = useMemo(
    () => bookings.filter(b => b.eventId === event.id),
    [bookings, event.id]
  );

  const metrics = useMemo(() => {
    const totalBookings = eventBookings.length;
    const totalTickets = eventBookings.reduce(
      (sum, b) => sum + b.tickets.reduce((s, t) => s + t.qty, 0), 0
    );
    const grossRevenue = eventBookings.reduce((sum, b) => sum + b.total, 0);
    const platformFee = Math.round(grossRevenue * PLATFORM_FEE_RATE);
    const netPayout = grossRevenue - platformFee;
    const checkedInCount = eventBookings.filter(b => checkedIn.has(b.id)).length;
    return { totalBookings, totalTickets, grossRevenue, platformFee, netPayout, checkedInCount };
  }, [eventBookings, checkedIn]);

  // Flat list: one row per ticket type per booking
  const attendeeRows = useMemo(() =>
    eventBookings.flatMap(b =>
      b.tickets.map(t => ({
        bookingId: b.id,
        name: b.attendee.name,
        email: b.attendee.email,
        phone: b.attendee.phone,
        ticketType: t.type,
        qty: t.qty,
        amount: t.price * t.qty,
        bookedAt: b.createdAt,
        checkedIn: checkedIn.has(b.id),
      }))
    ),
    [eventBookings, checkedIn]
  );

  const filteredRows = useMemo(() => {
    if (!search) return attendeeRows;
    const q = search.toLowerCase();
    return attendeeRows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.ticketType.toLowerCase().includes(q) ||
      r.bookingId.toLowerCase().includes(q)
    );
  }, [attendeeRows, search]);

  function exportCSV() {
    const header = ['Booking ID', 'Name', 'Email', 'Phone', 'Ticket Type', 'Qty', 'Amount (₹)', 'Booked At', 'Checked In'];
    const rows = attendeeRows.map(r => [
      r.bookingId,
      r.name,
      r.email,
      r.phone,
      r.ticketType,
      r.qty,
      r.amount,
      new Date(r.bookedAt).toLocaleString('en-IN'),
      r.checkedIn ? 'Yes' : 'No',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `${event.title.replace(/\s+/g, '_')}_attendees.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const eventDate = new Date(event.date + 'T00:00:00');
  const isPast = eventDate < new Date();
  const payoutStatus = isPast
    ? (metrics.grossRevenue > 0 ? 'processing' : 'none')
    : 'pending';

  return (
    <div className="od fade-up">
      {/* Event header */}
      <div className="od__header">
        <button className="od__back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          All Events
        </button>

        <div className="od__event-info">
          <div className="od__event-banner" style={{ background: event.gradient }}>
            <div className="od__event-banner-overlay" />
          </div>
          <div className="od__event-text">
            <p className="od__event-cat">{event.category}</p>
            <h2 className="od__event-title">{event.title}</h2>
            <p className="od__event-meta">
              {formatDate(event.date)}
              <span>·</span>
              {event.venue}, {event.city}
            </p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="od__metrics">
        <div className="od__metric">
          <div className="od__metric-label">Bookings</div>
          <div className="od__metric-value">{metrics.totalBookings}</div>
          {metrics.totalBookings > 0 && (
            <div className="od__metric-sub">{metrics.checkedInCount} checked in</div>
          )}
        </div>

        <div className="od__metric">
          <div className="od__metric-label">Tickets Sold</div>
          <div className="od__metric-value">{metrics.totalTickets}</div>
        </div>

        <div className="od__metric od__metric--highlight">
          <div className="od__metric-label">Gross Revenue</div>
          <div className="od__metric-value">
            {metrics.grossRevenue === 0 ? '—' : `₹${metrics.grossRevenue.toLocaleString('en-IN')}`}
          </div>
        </div>

        <div className="od__metric od__metric--payout">
          <div className="od__metric-label">Your Payout</div>
          <div className="od__metric-value">
            {metrics.netPayout === 0 ? '—' : `₹${metrics.netPayout.toLocaleString('en-IN')}`}
          </div>
          {metrics.grossRevenue > 0 && (
            <div className="od__metric-sub">after 10% fee</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="od__tabs">
        <button
          className={`od__tab ${activeTab === 'attendees' ? 'od__tab--active' : ''}`}
          onClick={() => setActiveTab('attendees')}
        >
          Attendees
          {attendeeRows.length > 0 && <span className="od__tab-count">{attendeeRows.length}</span>}
        </button>
        <button
          className={`od__tab ${activeTab === 'verify' ? 'od__tab--active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          Verify at Door
        </button>
        <button
          className={`od__tab ${activeTab === 'payout' ? 'od__tab--active' : ''}`}
          onClick={() => setActiveTab('payout')}
        >
          Payout
        </button>
      </div>

      {/* ── Attendees ── */}
      {activeTab === 'attendees' && (
        <div className="od__section">
          {eventBookings.length === 0 ? (
            <div className="od__empty">
              <p>No bookings yet.</p>
              <p className="od__empty-sub">Share your event link to start selling tickets.</p>
            </div>
          ) : (
            <>
              <div className="od__toolbar">
                <div className="od__search-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search name, email, ticket type…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="od__search"
                  />
                </div>
                <button className="btn btn-outline btn-sm" onClick={exportCSV}>
                  Export CSV
                </button>
              </div>

              <div className="od__table">
                <div className="od__table-head">
                  <span>Attendee</span>
                  <span>Ticket</span>
                  <span>Amount</span>
                  <span>Date</span>
                  <span>Status</span>
                </div>

                {filteredRows.length === 0 ? (
                  <div className="od__empty" style={{ padding: '32px 0' }}>
                    <p>No results match "{search}"</p>
                  </div>
                ) : (
                  filteredRows.map((row, i) => (
                    <div
                      key={i}
                      className={`od__table-row ${row.checkedIn ? 'od__table-row--in' : ''}`}
                    >
                      <div className="od__attendee-info">
                        <div className="od__attendee-name">{row.name}</div>
                        <div className="od__attendee-email">{row.email}</div>
                      </div>
                      <div className="od__attendee-ticket">
                        {row.ticketType}
                        {row.qty > 1 && <span className="od__qty"> ×{row.qty}</span>}
                      </div>
                      <div className="od__attendee-amount">
                        {row.amount === 0 ? <span className="od__free">Free</span> : `₹${row.amount.toLocaleString('en-IN')}`}
                      </div>
                      <div className="od__attendee-date">
                        {new Date(row.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="od__attendee-status">
                        {row.checkedIn ? (
                          <span className="od__badge-in">Checked in</span>
                        ) : (
                          <button
                            className="od__checkin-btn"
                            onClick={() => checkIn(row.bookingId)}
                          >
                            Check in
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Verify at Door ── */}
      {activeTab === 'verify' && (
        <div className="od__section">
          <QRVerifier
            bookings={eventBookings}
            checkedIn={checkedIn}
            onCheckIn={checkIn}
          />
        </div>
      )}

      {/* ── Payout ── */}
      {activeTab === 'payout' && (
        <div className="od__section od__payout-section">
          <div className="od__payout-card">
            <h3 className="od__payout-title">Payout Breakdown</h3>

            <div className="od__payout-rows">
              <div className="od__payout-row">
                <span>Gross Revenue</span>
                <strong>₹{metrics.grossRevenue.toLocaleString('en-IN')}</strong>
              </div>
              <div className="od__payout-row od__payout-row--fee">
                <span>Platform Fee (10%)</span>
                <strong>− ₹{metrics.platformFee.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="od__payout-total">
              <span>Your Payout</span>
              <strong>₹{metrics.netPayout.toLocaleString('en-IN')}</strong>
            </div>

            <div className="od__payout-status-row">
              <span className="od__payout-status-label">Status</span>
              <span className={`od__payout-badge od__payout-badge--${payoutStatus}`}>
                {payoutStatus === 'pending' && 'Pending: paid 30 min after event starts'}
                {payoutStatus === 'processing' && 'Processing: within 24 hours'}
                {payoutStatus === 'none' && 'No paid tickets'}
              </span>
            </div>

            {metrics.netPayout > 0 && !isPast && (
              <button className="btn btn-outline btn-full" style={{ marginTop: 24 }}>
                Request Early Payout
              </button>
            )}
          </div>

          <div className="od__payout-info">
            <h4>How payouts work</h4>
            <ul>
              <li>Q2Q charges a <strong>10% platform fee</strong> on paid ticket revenue</li>
              <li>Free events have no platform fee</li>
              <li>Payouts are processed <strong>within 30 minutes of your event starting</strong></li>
              <li>Transfers are made via NEFT / IMPS to your registered bank account</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
