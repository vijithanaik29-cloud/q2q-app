import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatDate } from '../data/events';
import './MyBookings.css';

function BookingCard({ booking }) {
  const isPast = booking.eventDate && booking.eventDate < new Date().toISOString().slice(0, 10);

  return (
    <div className={`mb-card ${isPast ? 'mb-card--past' : ''}`}>
      {/* Gradient header — event title lives here */}
      <div className="mb-card__header" style={{ background: booking.gradient || 'linear-gradient(135deg,#667eea,#764ba2)' }}>
        {isPast && <span className="mb-card__past-badge">Past</span>}
        <h3 className="mb-card__title">{booking.eventTitle}</h3>
        <div className="mb-card__meta">
          <span>📅 {formatDate(booking.eventDate)}</span>
          <span>📍 {booking.eventVenue}, {booking.eventCity}</span>
        </div>
      </div>

      {/* Tear line */}
      <div className="mb-card__tear" />

      {/* Footer strip */}
      <div className="mb-card__footer">
        <div className="mb-card__footer-left">
          <div className="mb-card__tickets">
            {(booking.tickets || []).map((t, i) => (
              <span key={i} className="mb-ticket-chip">{t.type} × {t.qty}</span>
            ))}
          </div>
          {booking.attendee?.name && (
            <div className="mb-card__attendee">👤 {booking.attendee.name}</div>
          )}
          <div className="mb-card__ref">{booking.id}</div>
        </div>
        <div className="mb-card__footer-right">
          {booking.total > 0
            ? <div className="mb-card__total">₹{booking.total.toLocaleString('en-IN')}</div>
            : <div className="mb-card__total mb-card__total--free">Free</div>
          }
          {booking.eventVenue && (
            <a
              className="mb-card__directions"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${booking.eventVenue}, ${booking.eventCity}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [step, setStep]       = useState('email'); // 'email' | 'sent' | 'loading' | 'results'
  const [email, setEmail]     = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const [bookings, setBookings] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [activeSection, setActiveSection] = useState('upcoming'); // 'today' | 'upcoming' | 'past'

  const loadBookings = useCallback(async (mail) => {
    setStep('loading');
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .filter('attendee->>email', 'eq', mail)
      .order('created_at', { ascending: false });
    const mapped = (data || []).map(row => ({
      id:         row.id,
      eventTitle: row.event_title,
      eventDate:  row.event_date,
      eventVenue: row.event_venue,
      eventCity:  row.event_city,
      gradient:   row.gradient,
      total:      row.total,
      tickets:    row.tickets,
      attendee:   row.attendee,
      createdAt:  row.created_at,
    }));
    setBookings(mapped);
    setStep('results');
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        loadBookings(session.user.email);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        loadBookings(session.user.email);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadBookings]);

  async function handleSend(e) {
    e.preventDefault();
    setSending(true); setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/my-bookings` },
    });
    setSending(false);
    if (err) setError(err.message);
    else setStep('sent');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setBookings([]); setUserEmail(''); setEmail(''); setStep('email');
  }

  if (step === 'email' || step === 'sent') {
    return (
      <div className="mb-login fade-up">
        <div className="container mb-login__inner">
          <div className="mb-login__card card">
            <div className="mb-login__icon">🎟️</div>
            <h1>My Tickets</h1>
            <p>Enter the email you used when booking — we'll send you a link to view all your tickets.</p>

            {step === 'sent' ? (
              <div className="mb-login__sent">
                <div className="mb-login__sent-icon">✉️</div>
                <strong>Check your inbox</strong>
                <p>We sent a link to <strong>{email}</strong>. Click it to see your tickets.</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep('email')}>
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend}>
                <input
                  type="email"
                  className="mb-login__input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                  autoFocus
                />
                {error && <p className="mb-login__error">{error}</p>}
                <button
                  type="submit"
                  className="btn btn-rainbow btn-full btn-lg"
                  disabled={sending || !email}
                >
                  {sending ? 'Sending…' : 'Send my tickets link'}
                </button>
              </form>
            )}

            <p className="mb-login__note">
              Bought tickets? <Link to="/">Explore more events →</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="mb-page fade-up">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-page fade-up">
      <div className="mb-hero">
        <div className="container mb-hero__inner">
          <div>
            <h1>My Tickets</h1>
            <p>{userEmail}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="container mb-body">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🎟️</div>
            <h3>No bookings found</h3>
            <p>No tickets were booked with <strong>{userEmail}</strong>.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
              Explore events
            </Link>
          </div>
        ) : (() => {
          const today        = new Date().toISOString().slice(0, 10);
          const todayList    = bookings.filter(b => b.eventDate === today);
          const upcomingList = bookings.filter(b => b.eventDate >  today);
          const pastList     = bookings.filter(b => b.eventDate <  today);

          const tabs = [
            { key: 'today',    label: 'Today',    count: todayList.length    },
            { key: 'upcoming', label: 'Upcoming', count: upcomingList.length },
            { key: 'past',     label: 'Past',     count: pastList.length     },
          ].filter(t => t.count > 0);

          // fall back to first available tab if activeSection is empty
          const current  = tabs.find(t => t.key === activeSection) ? activeSection : tabs[0]?.key;
          const shownList = current === 'today' ? todayList
                          : current === 'past'  ? pastList
                          : upcomingList;

          return (
            <>
              {/* Filter tabs */}
              <div className="mb-tabs">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    className={`mb-tab ${current === t.key ? 'mb-tab--active' : ''}`}
                    onClick={() => setActiveSection(t.key)}
                  >
                    {t.label}
                    <span className="mb-tab__count">{t.count}</span>
                  </button>
                ))}
              </div>

              {/* Cards for active section */}
              <div className="mb-list">
                {shownList.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
