import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatDate } from '../data/events';
import './MyBookings.css';

function BookingCard({ booking }) {
  const isPast = booking.eventDate && booking.eventDate < new Date().toISOString().slice(0, 10);
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className={`mb-card ${isPast ? 'mb-card--past' : ''} ${isCancelled ? 'mb-card--cancelled' : ''}`}>
      {/* Gradient header — event title lives here */}
      <div className="mb-card__header" style={{ background: booking.gradient || 'linear-gradient(135deg,#667eea,#764ba2)' }}>
        {isCancelled && <span className="mb-card__cancelled-badge">Cancelled</span>}
        {!isCancelled && isPast && <span className="mb-card__past-badge">Past</span>}
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
  const { signInWithGoogle } = useApp();
  const [step, setStep]       = useState('email'); // 'email' | 'sent' | 'loading' | 'results'
  const [email, setEmail]     = useState('');
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]     = useState('');
  const [bookings, setBookings] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [activeSection, setActiveSection] = useState('upcoming'); // 'today' | 'upcoming' | 'past' | 'cancelled'

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
      status:     row.status || null,
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

  async function handleGoogle() {
    setGoogleLoading(true); setError('');
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err.message); setGoogleLoading(false); }
  }

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
            <p>Sign in to view your bookings and QR codes.</p>

            {step !== 'sent' && (
              <>
                <button
                  className="mb-login__google-btn"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                </button>
                <div className="mb-login__divider"><span>or use email</span></div>
              </>
            )}

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
          const today          = new Date().toISOString().slice(0, 10);
          const cancelledList  = bookings.filter(b => b.status === 'cancelled');
          const activeBookings = bookings.filter(b => b.status !== 'cancelled');
          const todayList      = activeBookings.filter(b => b.eventDate === today);
          const upcomingList   = activeBookings.filter(b => b.eventDate >  today);
          const pastList       = activeBookings.filter(b => b.eventDate <  today);

          const tabs = [
            { key: 'today',     label: 'Today',     count: todayList.length     },
            { key: 'upcoming',  label: 'Upcoming',  count: upcomingList.length  },
            { key: 'past',      label: 'Past',      count: pastList.length      },
            ...(cancelledList.length > 0
              ? [{ key: 'cancelled', label: 'Cancelled', count: cancelledList.length }]
              : []),
          ];

          const current = activeSection;
          const shownList = current === 'today'     ? todayList
                          : current === 'past'      ? pastList
                          : current === 'cancelled' ? cancelledList
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
              {shownList.length === 0 ? (
                <div className="mb-empty">
                  <span className="mb-empty__icon">🎟️</span>
                  <p>No {current} tickets</p>
                </div>
              ) : (
                <div className="mb-list">
                  {shownList.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
