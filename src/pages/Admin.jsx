import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CITIES, CATEGORIES, formatDate } from '../data/events';
import OrganizerDashboard from '../components/OrganizerDashboard';
import { supabase } from '../lib/supabase';
import './Admin.css';

const GRADIENTS = [
  { label: 'Purple Dream', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Pink Flame', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Golden Night', value: 'linear-gradient(135deg, #FDBB2D 0%, #3A1C71 100%)' },
  { label: 'Ocean Blue', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Sunset Rose', value: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' },
  { label: 'Emerald', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: 'Warm Peach', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { label: 'Deep Ocean', value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { label: 'Cotton Candy', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { label: 'Sky Blue', value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
  { label: 'Coral Blush', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'Lavender', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
];

const BLANK_EVENT = {
  title: '', city: CITIES[1], venue: '', address: '', date: '',
  time: '', endTime: '', category: CATEGORIES[0], description: '',
  gradient: GRADIENTS[0].value, organizer: '', organizerContact: '',
  tickets: [{ type: 'General Admission', price: '', description: '', available: '' }],
};

export default function Admin() {
  const { allEvents, addEvent, user, signIn, signOut, authLoading } = useApp();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn,  setSigningIn]  = useState(false);
  const [activeTab,  setActiveTab]  = useState('list');
  const [form,       setForm]       = useState(BLANK_EVENT);
  const [errors,     setErrors]     = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [applications,    setApplications]    = useState([]);
  const [appsLoading,     setAppsLoading]     = useState(false);
  const [appActionId,     setAppActionId]     = useState(null);

  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [refundingEvent,  setRefundingEvent]  = useState(null);
  const [refundResults,   setRefundResults]   = useState({});

  const SUPERADMIN = 'vijithanaik29@gmail.com';

  const BLANK_BANK = { account_holder_name: '', bank_name: '', account_number: '', ifsc_code: '' };
  const [bankForm,     setBankForm]     = useState(BLANK_BANK);
  const [bankLoading,  setBankLoading]  = useState(false);
  const [bankSaving,   setBankSaving]   = useState(false);
  const [bankSaved,    setBankSaved]    = useState(false);
  const [bankError,    setBankError]    = useState('');

  useEffect(() => {
    if (user && activeTab === 'applications') loadApplications();
    if (user && activeTab === 'payout') loadBankDetails();
    if (user && activeTab === 'bookings') loadBookings();
  }, [user, activeTab]);

  async function loadBookings() {
    setBookingsLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    setBookings(data || []);
    setBookingsLoading(false);
  }

  async function handleRefundEvent(eventId, eventTitle) {
    if (!window.confirm(`Cancel "${eventTitle}" and refund ALL active bookings? This cannot be undone.`)) return;
    setRefundingEvent(eventId);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('refund-event', {
      body: { event_id: eventId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setRefundingEvent(null);
    if (error) {
      alert('Refund failed: ' + error.message);
      return;
    }
    setRefundResults(prev => ({ ...prev, [eventId]: data }));
    await loadBookings();
  }

  function groupBookingsByEvent(bookings) {
    const groups = {};
    for (const b of bookings) {
      if (!groups[b.event_id]) {
        groups[b.event_id] = { event_id: b.event_id, event_title: b.event_title, bookings: [] };
      }
      groups[b.event_id].bookings.push(b);
    }
    return Object.values(groups);
  }

  async function loadBankDetails() {
    setBankLoading(true);
    const { data } = await supabase
      .from('organizer_bank_details')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setBankForm({
      account_holder_name: data.account_holder_name,
      bank_name: data.bank_name,
      account_number: data.account_number,
      ifsc_code: data.ifsc_code,
    });
    setBankLoading(false);
  }

  async function handleBankSave(e) {
    e.preventDefault();
    setBankError('');
    if (!bankForm.account_holder_name.trim() || !bankForm.bank_name.trim() ||
        !bankForm.account_number.trim() || !bankForm.ifsc_code.trim()) {
      setBankError('All fields are required.');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifsc_code.trim().toUpperCase())) {
      setBankError('Enter a valid IFSC code (e.g. SBIN0001234).');
      return;
    }
    setBankSaving(true);
    const { error } = await supabase.from('organizer_bank_details').upsert({
      user_id: user.id,
      ...bankForm,
      ifsc_code: bankForm.ifsc_code.trim().toUpperCase(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setBankSaving(false);
    if (error) { setBankError(error.message); return; }
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3000);
  }

  async function loadApplications() {
    setAppsLoading(true);
    const { data } = await supabase
      .from('organizer_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setAppsLoading(false);
  }

  async function handleApprove(app) {
    setAppActionId(app.id);
    const { error } = await supabase.auth.admin
      ? // use service role if available
        null
      : null;
    // Invite the user — Supabase sends them a "set password" magic link
    const { error: inviteErr } = await supabase.functions.invoke('invite-organizer', {
      body: { email: app.email, name: app.name, app_id: app.id },
    });
    if (inviteErr) {
      alert('Could not send invite: ' + inviteErr.message);
      setAppActionId(null);
      return;
    }
    await supabase.from('organizer_applications')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', app.id);
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
    setAppActionId(null);
  }

  async function handleReject(app) {
    if (!window.confirm(`Reject application from ${app.name}? This cannot be undone.`)) return;
    setAppActionId(app.id);
    await supabase.from('organizer_applications')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', app.id);
    // Send rejection email (silently skips if Resend not configured yet)
    await supabase.functions.invoke('send-rejection', {
      body: { email: app.email, name: app.name, org_name: app.org_name },
    });
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
    setAppActionId(null);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true);
    setLoginError('');
    const { error } = await signIn(email, password);
    setSigningIn(false);
    if (error) setLoginError(error.message);
  }

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  }

  function setTicket(i, key, val) {
    setForm(prev => {
      const tickets = [...prev.tickets];
      tickets[i] = { ...tickets[i], [key]: val };
      return { ...prev, tickets };
    });
  }

  function addTicketRow() {
    setForm(prev => ({
      ...prev,
      tickets: [...prev.tickets, { type: '', price: '', description: '', available: '' }],
    }));
  }

  function removeTicketRow(i) {
    setForm(prev => ({ ...prev, tickets: prev.tickets.filter((_, idx) => idx !== i) }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Required';
    if (!form.venue.trim()) errs.venue = 'Required';
    if (!form.date) errs.date = 'Required';
    if (!form.time) errs.time = 'Required';
    if (!form.description.trim()) errs.description = 'Required';
    if (!form.organizer.trim()) errs.organizer = 'Required';
    form.tickets.forEach((t, i) => {
      if (!t.type.trim()) errs[`ticket_type_${i}`] = 'Required';
      if (t.price === '' || isNaN(Number(t.price))) errs[`ticket_price_${i}`] = 'Enter a number (0 for free)';
    });
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const eventData = {
      ...form,
      tickets: form.tickets.map((t, i) => ({
        id: `t${i + 1}`,
        type: t.type,
        price: Number(t.price),
        description: t.description,
        available: Number(t.available) || 100,
      })),
      tags: [form.category.toLowerCase()],
      attendees: 0,
    };
    try {
      await addEvent(eventData);
      setSubmitted(true);
      setForm(BLANK_EVENT);
      setTimeout(() => { setSubmitted(false); setActiveTab('list'); }, 2000);
    } catch {
      setErrors(prev => ({ ...prev, _form: 'Failed to publish event. Please try again.' }));
    }
  }

  // ── Auth loading ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="admin-login fade-up">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  // ── Login form ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="admin-login fade-up">
        <div className="container admin-login__inner">
          <div className="admin-login__card card">
            <div className="admin-login__header">
              <div className="admin-login__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h1>Organizer Portal</h1>
              <p>Submit and manage queer events on Q2Q</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@yourorg.in"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                  autoComplete="current-password"
                />
                {loginError && <span className="admin__error">{loginError}</span>}
              </div>
              <button type="submit" className="btn btn-rainbow btn-full btn-lg" disabled={signingIn}>
                {signingIn ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <p className="admin-login__note">
              Don't have access? <a href="mailto:hello@q2q.in">Contact us</a> to become a verified organizer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Organizer dashboard for a specific event ────────────────────────────────
  if (selectedEvent) {
    return (
      <div className="admin fade-up">
        <div className="admin__hero">
          <div className="container admin__hero-inner">
            <h1>Dashboard</h1>
            <p>Sales, attendees, and payouts for your event</p>
          </div>
        </div>
        <div className="container admin__body">
          <OrganizerDashboard
            event={selectedEvent}
            onBack={() => setSelectedEvent(null)}
          />
        </div>
      </div>
    );
  }

  // ── Main portal ─────────────────────────────────────────────────────────────
  return (
    <div className="admin fade-up">
      <div className="admin__hero">
        <div className="container admin__hero-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1>Organizer Portal</h1>
            <p>Manage your queer events on Q2Q</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={signOut} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            Sign out
          </button>
        </div>
      </div>

      <div className="container admin__body">
        {/* Tabs */}
        <div className="admin__tabs">
          <button className={`admin__tab ${activeTab === 'list' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('list')}>
            Events ({allEvents.length})
          </button>
          <button className={`admin__tab ${activeTab === 'add' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('add')}>
            + Submit New Event
          </button>
          <button className={`admin__tab ${activeTab === 'applications' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('applications')}>
            Applications {applications.filter(a => a.status === 'pending').length > 0 && (
              <span className="admin__tab-badge">{applications.filter(a => a.status === 'pending').length}</span>
            )}
          </button>
          <button className={`admin__tab ${activeTab === 'payout' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('payout')}>
            Payout Details
          </button>
          {user?.email === SUPERADMIN && (
            <button className={`admin__tab admin__tab--super ${activeTab === 'bookings' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('bookings')}>
              🛡 Bookings & Refunds
            </button>
          )}
          {user?.email === SUPERADMIN && (
            <button className={`admin__tab admin__tab--super ${activeTab === 'sponsors' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('sponsors')}>
              ✦ Sponsors
            </button>
          )}
        </div>

        {/* Events list */}
        {activeTab === 'list' && (() => {
          const isSuperAdmin = user?.email === SUPERADMIN;
          const visibleEvents = isSuperAdmin
            ? allEvents
            : allEvents.filter(e => e.organizerId === user?.id);
          return (
            <div className="admin__list">
              {!isSuperAdmin && visibleEvents.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state__icon">🎟️</div>
                  <h3>No events yet</h3>
                  <p>Submit your first event using the <strong>+ Submit New Event</strong> tab above.</p>
                </div>
              )}
              <div className="admin__events-grid">
                {visibleEvents.map(event => (
                  <div key={event.id} className="admin__event-card card">
                    <div className="admin__event-banner" style={{ background: event.gradient }} />
                    <div className="admin__event-body">
                      <div className="admin__event-badges">
                        <span className="badge badge-green">Live</span>
                        <span className="badge badge-gray">{event.city}</span>
                      </div>
                      <h3 className="admin__event-title">{event.title}</h3>
                      <p className="admin__event-meta">{formatDate(event.date)}</p>
                      <p className="admin__event-meta">{event.venue}</p>
                      <button
                        className="admin__dashboard-btn"
                        onClick={() => setSelectedEvent(event)}
                      >
                        View Dashboard →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Applications */}
        {activeTab === 'applications' && (
          <div className="admin__applications">
            {appsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner" style={{ width: 28, height: 28 }} />
              </div>
            ) : applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📬</div>
                <h3>No applications yet</h3>
                <p>Share <strong>/apply</strong> with organizers to get started.</p>
              </div>
            ) : (
              <div className="admin__app-list">
                {applications.map(app => (
                  <div key={app.id} className={`admin__app-card card admin__app-card--${app.status}`}>
                    <div className="admin__app-top">
                      <div>
                        <div className="admin__app-name">{app.name} · <span className="admin__app-org">{app.org_name}</span></div>
                        <div className="admin__app-meta">{app.email} · {app.phone} · {app.city}</div>
                        <div className="admin__app-types">{app.event_types.join(', ')}</div>
                        {app.instagram && <div className="admin__app-meta">{app.instagram}</div>}
                        {app.website   && <div className="admin__app-meta">{app.website}</div>}
                        {app.message   && <p className="admin__app-msg">"{app.message}"</p>}
                      </div>
                      <span className={`admin__app-status admin__app-status--${app.status}`}>
                        {app.status}
                      </span>
                    </div>
                    {app.status === 'pending' && (
                      <div className="admin__app-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={appActionId === app.id}
                          onClick={() => handleApprove(app)}
                        >
                          {appActionId === app.id ? 'Sending invite…' : 'Approve & Send Invite'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={appActionId === app.id}
                          onClick={() => handleReject(app)}
                          style={{ color: 'var(--error)' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {app.status === 'approved' && (
                      <p className="admin__app-done">✓ Invite sent. Organiser can now set their password</p>
                    )}
                    {app.status === 'rejected' && (
                      <p className="admin__app-done" style={{ color: 'var(--error)' }}>✕ Rejected</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payout Details */}
        {activeTab === 'payout' && (
          <div style={{ maxWidth: 560 }}>
            <div className="admin__form-section">
              <h2>Bank Account for Payouts</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                We'll transfer your event earnings to this account after each event settles (typically 3–5 business days). Your details are stored securely and only used for payouts.
              </p>

              {bankLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <div className="spinner" style={{ width: 24, height: 24 }} />
                </div>
              ) : (
                <form onSubmit={handleBankSave} noValidate>
                  {bankSaved && (
                    <div className="admin__success">✓ Bank details saved successfully.</div>
                  )}
                  {bankError && (
                    <div className="admin__error" style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                      {bankError}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Account Holder Name *</label>
                    <input
                      type="text"
                      placeholder="Name as on bank account"
                      value={bankForm.account_holder_name}
                      onChange={e => { setBankForm(f => ({ ...f, account_holder_name: e.target.value })); setBankError(''); }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Bank Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={bankForm.bank_name}
                      onChange={e => { setBankForm(f => ({ ...f, bank_name: e.target.value })); setBankError(''); }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Account Number *</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={bankForm.account_number}
                      onChange={e => { setBankForm(f => ({ ...f, account_number: e.target.value.replace(/\D/g, '') })); setBankError(''); }}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="form-group">
                    <label>IFSC Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. SBIN0001234"
                      value={bankForm.ifsc_code}
                      onChange={e => { setBankForm(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() })); setBankError(''); }}
                      maxLength={11}
                      style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={bankSaving}>
                    {bankSaving ? 'Saving…' : 'Save Bank Details'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Bookings & Refunds — superadmin only */}
        {activeTab === 'bookings' && user?.email === SUPERADMIN && (
          <div className="admin__bookings">
            <div className="admin__bookings-header">
              <h2>All Bookings</h2>
              <button className="btn btn-ghost btn-sm" onClick={loadBookings}>↻ Refresh</button>
            </div>

            {bookingsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner" style={{ width: 28, height: 28 }} />
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🎟️</div>
                <h3>No bookings yet</h3>
                <p>Bookings will appear here once attendees start purchasing tickets.</p>
              </div>
            ) : (
              groupBookingsByEvent(bookings).map(group => {
                const active    = group.bookings.filter(b => b.status === 'active');
                const refunded  = group.bookings.filter(b => b.status === 'refunded');
                const revenue   = group.bookings.filter(b => b.status === 'active').reduce((s, b) => s + (b.total || 0), 0);
                const allPaid   = group.bookings.every(b => b.payout_released);
                const result    = refundResults[group.event_id];

                return (
                  <div key={group.event_id} className="admin__booking-group card">
                    <div className="admin__booking-group-header">
                      <div>
                        <div className="admin__booking-event-title">{group.event_title}</div>
                        <div className="admin__booking-event-stats">
                          <span className="admin__booking-stat admin__booking-stat--active">{active.length} active</span>
                          {refunded.length > 0 && <span className="admin__booking-stat admin__booking-stat--refunded">{refunded.length} refunded</span>}
                          <span className="admin__booking-stat">₹{revenue.toLocaleString('en-IN')} held</span>
                          <span className={`admin__booking-payout ${allPaid ? 'admin__booking-payout--released' : ''}`}>
                            {allPaid ? '✓ Payout released' : '⏳ Payout held'}
                          </span>
                        </div>
                      </div>
                      {active.length > 0 && (
                        <button
                          className="btn btn-sm admin__refund-btn"
                          disabled={refundingEvent === group.event_id}
                          onClick={() => handleRefundEvent(group.event_id, group.event_title)}
                        >
                          {refundingEvent === group.event_id ? 'Refunding…' : `Cancel & Refund ${active.length} bookings`}
                        </button>
                      )}
                    </div>

                    {result && (
                      <div className="admin__refund-result">
                        ✓ Refunded {result.refunded} bookings · ₹{(result.total_amount || 0).toLocaleString('en-IN')} returned to attendees
                      </div>
                    )}

                    <div className="admin__booking-table">
                      <div className="admin__booking-thead">
                        <span>Ref</span><span>Attendee</span><span>Tickets</span><span>Amount</span><span>Status</span><span>Date</span>
                      </div>
                      {group.bookings.map(b => (
                        <div key={b.id} className={`admin__booking-row admin__booking-row--${b.status}`}>
                          <span className="admin__booking-id">{b.id}</span>
                          <span>
                            <div>{b.attendee?.name}</div>
                            <div className="admin__booking-email">{b.attendee?.email}</div>
                          </span>
                          <span>{b.tickets?.map(t => `${t.type} ×${t.qty}`).join(', ')}</span>
                          <span>₹{(b.total || 0).toLocaleString('en-IN')}</span>
                          <span className={`admin__booking-status admin__booking-status--${b.status}`}>{b.status}</span>
                          <span className="admin__booking-date">{new Date(b.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Sponsors — superadmin only */}
        {activeTab === 'sponsors' && user?.email === SUPERADMIN && (
          <div className="admin__form-section" style={{ maxWidth: 640 }}>
            <h2>Sponsor Management</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              The homepage banner is controlled by <code>src/data/sponsors.js</code>. Set <code>activeSponsor</code> to an object to show a banner, or <code>null</code> to hide it. Push to main to go live.
            </p>

            <div className="admin__form-section" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Code to activate a sponsor
              </div>
              <pre style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, margin: 0, overflowX: 'auto' }}>{`export const activeSponsor = {
  name:    'Sponsor Name',
  tagline: 'Short tagline here.',
  link:    'https://their-website.com',
  tier:    'community',  // 'community' or 'pride'
  city:    'Mumbai',     // or null for all cities
};`}</pre>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Community Partner</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>₹999<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/month</span></div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Homepage banner strip, city-targeted, name + tagline + link.</div>
              </div>
              <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Pride Sponsor</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>₹2,499<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/month</span></div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>All-cities banner, logo on event pages, named in social posts.</div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Enquiries come to <strong>sponsor@q2q.co.in</strong>. When you agree a deal, open <code>src/data/sponsors.js</code> in your code editor, fill in the object above, and push. The banner goes live on main deploy.
            </p>
          </div>
        )}

        {/* Submit form */}
        {activeTab === 'add' && (
          <form className="admin__form" onSubmit={handleSubmit} noValidate>
            {submitted && (
              <div className="admin__success">
                ✅ Event submitted successfully! It's now live on Q2Q.
              </div>
            )}

            {errors._form && (
              <div className="admin__error" style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                {errors._form}
              </div>
            )}

            <div className="admin__form-section">
              <h2>Event Details</h2>

              <div className="form-group">
                <label>Event Title *</label>
                <input type="text" placeholder="e.g. Bangalore Pride Parade 2026" value={form.title} onChange={e => setField('title', e.target.value)} />
                {errors.title && <span className="admin__error">{errors.title}</span>}
              </div>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label>City *</label>
                  <select value={form.city} onChange={e => setField('city', e.target.value)}>
                    {CITIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => setField('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Venue Name *</label>
                <input type="text" placeholder="e.g. Cubbon Park Amphitheatre" value={form.venue} onChange={e => setField('venue', e.target.value)} />
                {errors.venue && <span className="admin__error">{errors.venue}</span>}
              </div>

              <div className="form-group">
                <label>Full Address</label>
                <input type="text" placeholder="Street, Area, City, PIN" value={form.address} onChange={e => setField('address', e.target.value)} />
              </div>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
                  {errors.date && <span className="admin__error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="time" value={form.time} onChange={e => setField('time', e.target.value)} />
                  {errors.time && <span className="admin__error">{errors.time}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea rows={4} placeholder="Tell people what to expect at your event…" value={form.description} onChange={e => setField('description', e.target.value)} />
                {errors.description && <span className="admin__error">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label>Card Colour Theme</label>
                <div className="admin__gradients">
                  {GRADIENTS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      className={`admin__gradient-swatch ${form.gradient === g.value ? 'admin__gradient-swatch--selected' : ''}`}
                      style={{ background: g.value }}
                      title={g.label}
                      onClick={() => setField('gradient', g.value)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="admin__form-section">
              <h2>Organizer Info</h2>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label>Organizer Name *</label>
                  <input type="text" placeholder="Your org or collective name" value={form.organizer} onChange={e => setField('organizer', e.target.value)} />
                  {errors.organizer && <span className="admin__error">{errors.organizer}</span>}
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" placeholder="contact@yourorg.in" value={form.organizerContact} onChange={e => setField('organizerContact', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="admin__form-section">
              <div className="admin__tickets-header">
                <h2>Ticket Types</h2>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addTicketRow}>+ Add Type</button>
              </div>

              {form.tickets.map((ticket, i) => (
                <div key={i} className="admin__ticket-row">
                  <div className="admin__ticket-row-header">
                    <span className="admin__ticket-num">Ticket {i + 1}</span>
                    {form.tickets.length > 1 && (
                      <button type="button" className="admin__ticket-remove" onClick={() => removeTicketRow(i)}>✕</button>
                    )}
                  </div>
                  <div className="form-row admin__ticket-fields">
                    <div className="form-group">
                      <label>Type Name *</label>
                      <input type="text" placeholder="General / VIP / Free" value={ticket.type} onChange={e => setTicket(i, 'type', e.target.value)} />
                      {errors[`ticket_type_${i}`] && <span className="admin__error">{errors[`ticket_type_${i}`]}</span>}
                    </div>
                    <div className="form-group">
                      <label>Price (₹) * (enter 0 for free)</label>
                      <input type="number" min="0" placeholder="499" value={ticket.price} onChange={e => setTicket(i, 'price', e.target.value)} />
                      {errors[`ticket_price_${i}`] && <span className="admin__error">{errors[`ticket_price_${i}`]}</span>}
                    </div>
                    <div className="form-group">
                      <label>Available Spots</label>
                      <input type="number" min="1" placeholder="100" value={ticket.available} onChange={e => setTicket(i, 'available', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input type="text" placeholder="What's included with this ticket" value={ticket.description} onChange={e => setTicket(i, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="admin__submit-row">
              <button type="submit" className="btn btn-primary btn-lg">
                Publish Event on Q2Q
              </button>
              <p className="admin__submit-note">Your event will be live immediately on the listings page.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
