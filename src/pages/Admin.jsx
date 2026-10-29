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

  useEffect(() => {
    if (user && activeTab === 'applications') loadApplications();
  }, [user, activeTab]);

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
        </div>

        {/* Events list */}
        {activeTab === 'list' && (
          <div className="admin__list">
            <div className="admin__events-grid">
              {allEvents.map(event => (
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
        )}

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
                      <p className="admin__app-done">✓ Invite sent — organizer can set their password</p>
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
                      <label>Price (₹) * — 0 for free</label>
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
