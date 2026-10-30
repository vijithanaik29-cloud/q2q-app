import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CITIES, CATEGORIES, formatDate } from '../data/events';
import OrganizerDashboard from '../components/OrganizerDashboard';
import { supabase } from '../lib/supabase';
import './Admin.css';

const SUPERADMIN = 'vijithanaik29@gmail.com';

const GRADIENTS = [
  { label: 'Purple Dream', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Pink Flame',   value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Golden Night', value: 'linear-gradient(135deg, #FDBB2D 0%, #3A1C71 100%)' },
  { label: 'Ocean Blue',   value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Sunset Rose',  value: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' },
  { label: 'Emerald',      value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: 'Warm Peach',   value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { label: 'Deep Ocean',   value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { label: 'Cotton Candy', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { label: 'Sky Blue',     value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
  { label: 'Coral Blush',  value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'Lavender',     value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
];

const BLANK_EVENT = {
  title: '', city: CITIES[1], venue: '', address: '', date: '',
  time: '', endTime: '', category: CATEGORIES[0], description: '',
  gradient: GRADIENTS[0].value, organizer: '', organizerContact: '',
  tickets: [{ type: 'General Admission', price: '', description: '', available: '' }],
};

function StatsTab({ myEvents }) {
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lastRefresh,setLastRefresh]= useState(null);

  async function load() {
    setLoading(true);
    const eventIds = myEvents.map(e => e.id);
    if (!eventIds.length) { setStats({ bookings: [], checkins: new Set() }); setLoading(false); return; }

    const { data: bData } = await supabase.from('bookings').select('*').in('event_id', eventIds);
    const bookingIds = (bData || []).map(b => b.id);
    const { data: ciData } = bookingIds.length
      ? await supabase.from('checkins').select('booking_id').in('booking_id', bookingIds)
      : { data: [] };

    setStats({ bookings: bData || [], checkins: new Set((ciData || []).map(c => c.booking_id)) });
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30 * 60 * 1000); // 30-min refresh
    return () => clearInterval(interval);
  }, [myEvents.length]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  const { bookings, checkins } = stats;
  const active    = bookings.filter(b => b.status !== 'cancelled');
  const cancelled = bookings.filter(b => b.status === 'cancelled');
  const totalTickets  = active.reduce((s, b) => s + (b.tickets || []).reduce((a, t) => a + t.qty, 0), 0);
  const totalRevenue  = active.reduce((s, b) => s + (b.total || 0), 0);
  const platformFee   = Math.round(totalRevenue * 0.10);
  const netPayout     = totalRevenue - platformFee;
  const totalCheckedIn= checkins.size;

  // per-event breakdown
  const perEvent = myEvents.map(ev => {
    const evBookings = active.filter(b => b.event_id === ev.id);
    const evCancelled = cancelled.filter(b => b.event_id === ev.id);
    const tickets  = evBookings.reduce((s, b) => s + (b.tickets || []).reduce((a, t) => a + t.qty, 0), 0);
    const revenue  = evBookings.reduce((s, b) => s + (b.total || 0), 0);
    const ciCount  = evBookings.filter(b => checkins.has(b.id)).length;
    const isPast   = ev.date && ev.date < new Date().toISOString().slice(0, 10);
    return { ev, tickets, revenue, ciCount, cancelled: evCancelled.length, isPast };
  });

  const tile = (label, value, sub) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '18px 20px', minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Overview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRefresh && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · auto-refreshes every 30 min</span>}
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {tile('Events Hosted', myEvents.length)}
        {tile('Tickets Sold', totalTickets)}
        {tile('Checked In', totalCheckedIn)}
        {tile('Cancelled', cancelled.length)}
        {tile('Gross Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`)}
        {tile('Net Payout', `₹${netPayout.toLocaleString('en-IN')}`, '(after 10% fee)')}
      </div>

      {/* Per-event table */}
      {myEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📊</div>
          <h3>No events yet</h3>
          <p>Stats will appear once you publish your first event.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-2)' }}>
                {['Event', 'Date', 'Tickets', 'Checked In', 'Cancelled', 'Revenue'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perEvent.map(({ ev, tickets, revenue, ciCount, cancelled: evCancelled, isPast }) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)', opacity: isPast ? 0.6 : 1 }}>
                  <td style={{ padding: '12px 12px', color: 'var(--text)', fontWeight: 600, maxWidth: 200 }}>
                    {ev.title}
                    {isPast && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-muted)' }}>Past</span>}
                  </td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(ev.date)}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{tickets}</td>
                  <td style={{ padding: '12px 12px', color: tickets > 0 ? 'var(--success, #34d399)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{ciCount}</td>
                  <td style={{ padding: '12px 12px', color: evCancelled > 0 ? '#f87171' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{evCancelled}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {revenue > 0 ? `₹${revenue.toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CheckInTab({ myEventIds = [] }) {
  const [query,      setQuery]      = useState('');
  const [searching,  setSearching]  = useState(false);
  const [results,    setResults]    = useState(null); // null = not searched yet
  const [checkedIn,  setCheckedIn]  = useState(new Set());
  const [checking,   setChecking]   = useState(null);
  const [error,      setError]      = useState('');

  const today = new Date().toISOString().slice(0, 10);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true); setError(''); setResults(null);

    const isId = /^Q2Q-/i.test(q);
    let data, err;

    if (isId) {
      ({ data, error: err } = await supabase
        .from('bookings').select('*').ilike('id', q)
        .gte('event_date', today).limit(1));
    } else {
      let qb = supabase.from('bookings').select('*')
        .ilike('attendee->>name', `%${q}%`)
        .gte('event_date', today)
        .limit(20);
      if (myEventIds.length) qb = qb.in('event_id', myEventIds);
      ({ data, error: err } = await qb);
    }

    if (err || !data) { setError('Something went wrong. Try again.'); setSearching(false); return; }
    if (data.length === 0) { setError(`No bookings found for "${q}".`); setResults([]); setSearching(false); return; }

    // fetch checkins for these booking ids
    const ids = data.map(b => b.id);
    const { data: ci } = await supabase.from('checkins').select('booking_id').in('booking_id', ids);
    const ciSet = new Set((ci || []).map(c => c.booking_id));
    setCheckedIn(ciSet);
    setResults(data);
    setSearching(false);
  }

  async function doCheckIn(id) {
    setChecking(id);
    await supabase.from('checkins').upsert({ booking_id: id });
    setCheckedIn(prev => new Set([...prev, id]));
    setChecking(null);
  }

  return (
    <div className="admin__form-section" style={{ maxWidth: 520 }}>
      <h2>Door Check-in</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Search by booking ID (e.g. Q2Q-PRIVN-A8F3K) or attendee name. Only today's and upcoming events are shown — past events disappear automatically.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 15, outline: 'none' }}
          placeholder="Booking ID or name…"
          value={query}
          onChange={e => { setQuery(e.target.value); setError(''); }}
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={searching || !query.trim()}>
          {searching ? '…' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: 'var(--error, #f87171)', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      {results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {results.map(b => {
            const done = checkedIn.has(b.id);
            return (
              <div key={b.id} style={{ background: 'var(--surface)', border: `1px solid ${done ? 'rgba(52,211,153,0.35)' : 'var(--border-2)'}`, borderRadius: 12, padding: '16px 18px' }}>
                {done && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success, #34d399)', marginBottom: 10, padding: '6px 12px', background: 'rgba(52,211,153,0.1)', borderRadius: 6, display: 'inline-block' }}>✅ Already checked in</div>
                )}

                {/* Attendee */}
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{b.attendee?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 1 }}>{b.attendee?.email}</div>
                {b.attendee?.phone && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    ••••••{String(b.attendee.phone).slice(-4)}
                  </div>
                )}

                {/* Event */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{b.event_title}</div>
                  {b.event_date && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>
                      📅 {new Date(b.event_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  {b.event_venue && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>📍 {b.event_venue}, {b.event_city}</div>
                  )}
                </div>

                {/* Tickets + payment */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 2 }}>
                    🎟 {(b.tickets || []).map(t => `${t.type} ×${t.qty}`).join(', ')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                    💳 {b.total > 0 ? `₹${b.total.toLocaleString('en-IN')} paid` : 'Free ticket'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{b.id}</div>
                </div>

                {!done && (
                  <button className="btn btn-primary btn-sm" disabled={checking === b.id} onClick={() => doCheckIn(b.id)}>
                    {checking === b.id ? 'Checking in…' : '✅ Check In'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { allEvents, addEvent, user, signIn, signInWithPassword, signUpWithPassword, signInWithGoogle, resetPassword, signOut, authLoading } = useApp();

  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [signingIn,     setSigningIn]     = useState(false);
  const [linkSent,      setLinkSent]      = useState(false);
  const [resetSent,     setResetSent]     = useState(false);
  const [authMode,      setAuthMode]      = useState('login'); // 'login' | 'signup' | 'forgot'
  const [resendCooldown,setResendCooldown]= useState(0);

  const [activeTab,     setActiveTab]     = useState('list');
  const [form,          setForm]          = useState(BLANK_EVENT);
  const [errors,        setErrors]        = useState({});
  const [submitted,     setSubmitted]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const BLANK_SPONSOR = { plan: '', business_name: '', tagline: '', link: '', city: '' };
  const [mySponsorSub,  setMySponsorSub]  = useState(null);
  const [sponsorSubLoad,setSponsorSubLoad]= useState(false);
  const [sponsorForm,   setSponsorForm]   = useState(BLANK_SPONSOR);
  const [sponsorSaving, setSponsorSaving] = useState(false);
  const [sponsorError,  setSponsorError]  = useState('');
  const [sponsorDone,   setSponsorDone]   = useState(false);

  const BLANK_BANK = { account_holder_name: '', bank_name: '', account_number: '', ifsc_code: '' };
  const [bankForm,   setBankForm]   = useState(BLANK_BANK);
  const [bankLoading,setBankLoading]= useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved,  setBankSaved]  = useState(false);
  const [bankError,  setBankError]  = useState('');


  const isSuperAdmin = user?.email === SUPERADMIN;

  useEffect(() => {
    if (user && activeTab === 'payout')    loadBankDetails();
    if (user && activeTab === 'advertise') loadMySponsorSub();
  }, [user, activeTab]);

  async function loadMySponsorSub() {
    if (!user) return;
    setSponsorSubLoad(true);
    const { data } = await supabase
      .from('sponsor_submissions')
      .select('*')
      .eq('organiser_email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setMySponsorSub(data || null);
    if (data) setSponsorForm({ plan: data.plan, business_name: data.business_name, tagline: data.tagline, link: data.link, city: data.city || '' });
    setSponsorSubLoad(false);
  }

  async function submitSponsor(e) {
    e.preventDefault();
    setSponsorError('');
    if (!sponsorForm.plan) { setSponsorError('Please choose a plan.'); return; }
    if (!sponsorForm.business_name.trim()) { setSponsorError('Business name is required.'); return; }
    if (!sponsorForm.tagline.trim()) { setSponsorError('Tagline is required.'); return; }
    if (!sponsorForm.link.trim()) { setSponsorError('Website link is required.'); return; }
    if (sponsorForm.plan === 'community' && !sponsorForm.city) { setSponsorError('Please select a city.'); return; }
    setSponsorSaving(true);
    const payload = {
      organiser_email: user.email,
      plan:            sponsorForm.plan,
      business_name:   sponsorForm.business_name.trim(),
      tagline:         sponsorForm.tagline.trim(),
      link:            sponsorForm.link.trim(),
      city:            sponsorForm.plan === 'community' ? sponsorForm.city : null,
      content_hash:    btoa(`${sponsorForm.plan}|${sponsorForm.business_name.trim()}|${sponsorForm.tagline.trim()}|${sponsorForm.link.trim()}|${sponsorForm.city}`),
      status:          'pending',
    };
    const { error } = await supabase.from('sponsor_submissions').insert(payload);
    setSponsorSaving(false);
    if (error) { setSponsorError('Could not submit. Please try again.'); return; }
    setSponsorDone(true);
    loadMySponsorSub();
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
      bank_name:           data.bank_name,
      account_number:      data.account_number,
      ifsc_code:           data.ifsc_code,
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
      ifsc_code:  bankForm.ifsc_code.trim().toUpperCase(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setBankSaving(false);
    if (error) { setBankError(error.message); return; }
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3000);
  }


  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true); setLoginError('');
    if (authMode === 'forgot') {
      const { error } = await resetPassword(email);
      setSigningIn(false);
      if (error) setLoginError(error.message);
      else setResetSent(true);
      return;
    }
    if (authMode === 'signup') {
      const { error } = await signUpWithPassword(email, password);
      setSigningIn(false);
      if (error) setLoginError(error.message);
      else setLinkSent(true);
      return;
    }
    // login mode — try password first
    const { error } = await signInWithPassword(email, password);
    setSigningIn(false);
    if (error) setLoginError('Incorrect email or password.');
  }

  async function handleGoogle() {
    setSigningIn(true); setLoginError('');
    const { error } = await signInWithGoogle();
    if (error) { setSigningIn(false); setLoginError(error.message); }
    // on success browser redirects to /admin
  }

  function startResendCooldown() {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function resendLink() {
    setSigningIn(true); setLoginError('');
    const { error } = await signIn(email);
    setSigningIn(false);
    if (error) setLoginError(error.message);
    else startResendCooldown();
  }

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  }
  function setTicket(i, key, val) {
    setForm(prev => { const t = [...prev.tickets]; t[i] = { ...t[i], [key]: val }; return { ...prev, tickets: t }; });
  }
  function addTicketRow() { setForm(prev => ({ ...prev, tickets: [...prev.tickets, { type: '', price: '', description: '', available: '' }] })); }
  function removeTicketRow(i) { setForm(prev => ({ ...prev, tickets: prev.tickets.filter((_, idx) => idx !== i) })); }

  function validate() {
    const errs = {};
    if (!form.title.trim())       errs.title       = 'Required';
    if (!form.venue.trim())       errs.venue       = 'Required';
    if (!form.date)               errs.date        = 'Required';
    if (!form.time)               errs.time        = 'Required';
    if (!form.description.trim()) errs.description = 'Required';
    if (!form.organizer.trim())   errs.organizer   = 'Required';
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
        id: `t${i + 1}`, type: t.type, price: Number(t.price),
        description: t.description, available: Number(t.available) || 100,
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

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="admin-login fade-up">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="admin-login fade-up">
        <div className="container admin-login__inner">
          <div className="admin-login__card card">
            <div className="admin-login__header">
              <div className="admin-login__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h1>Organizer Portal</h1>
              <p>Submit and manage queer events on Q2Q</p>
            </div>

            {linkSent ? (
              <div className="admin-login__sent">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <p><strong>Check your email</strong></p>
                <p className="admin-login__sent-sub">
                  {authMode === 'signup'
                    ? <>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</>
                    : <>We sent a password-reset link to <strong>{email}</strong>.</>}
                </p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => { setLinkSent(false); setResetSent(false); setAuthMode('login'); }}>
                  Back to login
                </button>
              </div>
            ) : resetSent ? (
              <div className="admin-login__sent">
                <p><strong>Reset link sent</strong></p>
                <p className="admin-login__sent-sub">Check <strong>{email}</strong> for a password reset link.</p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => { setResetSent(false); setAuthMode('login'); }}>
                  Back to login
                </button>
              </div>
            ) : (
              <>
                {/* Google sign-in */}
                <button type="button" className="btn-google" onClick={handleGoogle} disabled={signingIn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="admin-login__divider"><span>or</span></div>

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="adm-email">Email</label>
                    <input id="adm-email" type="email" placeholder="you@yourorg.in" value={email}
                      onChange={e => { setEmail(e.target.value); setLoginError(''); }} autoComplete="email" />
                  </div>
                  {authMode !== 'forgot' && (
                    <div className="form-group">
                      <label htmlFor="adm-pass">Password</label>
                      <input id="adm-pass" type="password" placeholder="••••••••" value={password}
                        onChange={e => { setPassword(e.target.value); setLoginError(''); }} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} />
                    </div>
                  )}
                  {loginError && <span className="admin__error" style={{ display: 'block', marginBottom: 12 }}>{loginError}</span>}
                  <button type="submit" className="btn btn-rainbow btn-full btn-lg" disabled={signingIn || !email || (authMode !== 'forgot' && !password)}>
                    {signingIn ? 'Please wait…' : authMode === 'signup' ? 'Create account' : authMode === 'forgot' ? 'Send reset link' : 'Sign in'}
                  </button>
                </form>

                <div className="admin-login__switch">
                  {authMode === 'login' && <>
                    <button type="button" onClick={() => { setAuthMode('signup'); setLoginError(''); }}>Create an account</button>
                    <span>·</span>
                    <button type="button" onClick={() => { setAuthMode('forgot'); setLoginError(''); }}>Forgot password?</button>
                  </>}
                  {authMode === 'signup' && <button type="button" onClick={() => { setAuthMode('login'); setLoginError(''); }}>Already have an account? Sign in</button>}
                  {authMode === 'forgot' && <button type="button" onClick={() => { setAuthMode('login'); setLoginError(''); }}>Back to sign in</button>}
                </div>
              </>
            )}

            <p className="admin-login__note">
              Don't have access? <a href="mailto:hello@q2q.in">Contact us</a> to become a verified organizer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Organizer event dashboard ────────────────────────────────────────────────
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
          <OrganizerDashboard event={selectedEvent} onBack={() => setSelectedEvent(null)} />
        </div>
      </div>
    );
  }

  // ── Main organiser portal ────────────────────────────────────────────────────
  const myEvents = allEvents.filter(e => e.organizerId === user?.id);

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
          <button className={`admin__tab ${activeTab === 'list'     ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('list')}>
            My Events ({myEvents.length})
          </button>
          <button className={`admin__tab ${activeTab === 'add'      ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('add')}>
            + Submit New Event
          </button>
          <button className={`admin__tab ${activeTab === 'payout'   ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('payout')}>
            Payout Details
          </button>
          <button className={`admin__tab ${activeTab === 'advertise'? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('advertise')}>
            ✦ Advertise
          </button>
          <button className={`admin__tab ${activeTab === 'scanner'  ? 'admin__tab--active' : ''}`}
            onClick={() => setActiveTab('scanner')}>
            ✅ Check-in
          </button>
          <button className={`admin__tab ${activeTab === 'stats' ? 'admin__tab--active' : ''}`}
            onClick={() => setActiveTab('stats')}>
            📊 Stats
          </button>
        </div>

        {/* My Events */}
        {activeTab === 'list' && (
          <div className="admin__list">
            {myEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🎟️</div>
                <h3>No events yet</h3>
                <p>Submit your first event using the <strong>+ Submit New Event</strong> tab above.</p>
              </div>
            ) : (
              <div className="admin__events-grid">
                {myEvents.map(event => (
                  <div key={event.id} className="admin__event-card card">
                    <div className="admin__event-banner" style={{ background: event.gradient }} />
                    <div className="admin__event-body">
                      <div className="admin__event-badges">
                        <span className="badge badge-green">Live</span>
                        <span className="badge badge-gray">{event.city}</span>
                        {event.boosted && <span className="badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.3)' }}>⚡ Boosted</span>}
                      </div>
                      <h3 className="admin__event-title">{event.title}</h3>
                      <p className="admin__event-meta">{formatDate(event.date)}</p>
                      <p className="admin__event-meta">{event.venue}</p>
                      <button className="admin__dashboard-btn" style={{ marginTop: 12, width: '100%' }} onClick={() => setSelectedEvent(event)}>
                        View Dashboard →
                      </button>
                    </div>
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
                  {bankSaved  && <div className="admin__success">✓ Bank details saved successfully.</div>}
                  {bankError  && <div className="admin__error" style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>{bankError}</div>}
                  <div className="form-group">
                    <label>Account Holder Name *</label>
                    <input type="text" placeholder="Name as on bank account" value={bankForm.account_holder_name}
                      onChange={e => { setBankForm(f => ({ ...f, account_holder_name: e.target.value })); setBankError(''); }} />
                  </div>
                  <div className="form-group">
                    <label>Bank Name *</label>
                    <input type="text" placeholder="e.g. State Bank of India" value={bankForm.bank_name}
                      onChange={e => { setBankForm(f => ({ ...f, bank_name: e.target.value })); setBankError(''); }} />
                  </div>
                  <div className="form-group">
                    <label>Account Number *</label>
                    <input type="text" placeholder="Enter account number" value={bankForm.account_number} inputMode="numeric"
                      onChange={e => { setBankForm(f => ({ ...f, account_number: e.target.value.replace(/\D/g, '') })); setBankError(''); }} />
                  </div>
                  <div className="form-group">
                    <label>IFSC Code *</label>
                    <input type="text" placeholder="e.g. SBIN0001234" value={bankForm.ifsc_code} maxLength={11}
                      style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 }}
                      onChange={e => { setBankForm(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() })); setBankError(''); }} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={bankSaving}>
                    {bankSaving ? 'Saving…' : 'Save Bank Details'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Advertise */}
        {activeTab === 'advertise' && (
          <div className="admin__form-section" style={{ maxWidth: 640 }}>
            <h2>Advertise on Q2Q</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.7 }}>
              Put your business in front of India's queer community. Choose a plan, fill in your banner details, and we'll review it — usually within 24 hours. Once approved, you'll receive payment instructions and your banner goes live immediately after payment.
            </p>

            {sponsorSubLoad ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
            ) : mySponsorSub && !sponsorDone ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 10, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99,
                    background: mySponsorSub.status === 'active' ? 'var(--success-dim)' : mySponsorSub.status === 'approved' ? 'rgba(139,92,246,0.1)' : mySponsorSub.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'var(--accent-dim)',
                    color:      mySponsorSub.status === 'active' ? 'var(--success)'     : mySponsorSub.status === 'approved' ? '#8B5CF6'                 : mySponsorSub.status === 'rejected' ? 'var(--error)'             : 'var(--accent)',
                  }}>
                    {mySponsorSub.status === 'active' ? '● Live' : mySponsorSub.status === 'approved' ? '✓ Approved — awaiting payment' : mySponsorSub.status === 'rejected' ? '✕ Needs edits' : '○ Under review'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {mySponsorSub.plan === 'community' ? 'Community Partner · ₹999/mo' : 'Pride Sponsor · ₹2,499/mo'}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{mySponsorSub.business_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>{mySponsorSub.tagline}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{mySponsorSub.link}{mySponsorSub.city ? ` · ${mySponsorSub.city}` : ''}</div>
                {mySponsorSub.review_note && (
                  <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                    <strong>Note from Q2Q:</strong> {mySponsorSub.review_note}
                  </div>
                )}
                {mySponsorSub.status === 'approved' && (
                  <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 13, lineHeight: 1.7 }}>
                    Your banner is approved! To go live, send your payment to <strong>sponsor@q2q.co.in</strong> and we'll activate it within a few hours.
                  </div>
                )}
                {mySponsorSub.status === 'rejected' && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => { setMySponsorSub(null); setSponsorDone(false); }}>
                    Edit and resubmit
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={submitSponsor} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { key: 'community', label: 'Community Partner', price: '₹999/mo',   desc: 'City-targeted banner · name + tagline + link' },
                    { key: 'pride',     label: 'Pride Sponsor',     price: '₹2,499/mo', desc: 'All-cities banner · every event page' },
                  ].map(p => (
                    <button key={p.key} type="button" onClick={() => setSponsorForm(f => ({ ...f, plan: p.key }))}
                      style={{ textAlign: 'left', padding: 18, borderRadius: 10, cursor: 'pointer',
                        border:      sponsorForm.plan === p.key ? '2px solid var(--accent)' : '1px solid var(--border-2)',
                        background:  sponsorForm.plan === p.key ? 'var(--accent-dim)'       : 'var(--surface)',
                      }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 6 }}>{p.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{p.price}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <label className="admin__label">Business name</label>
                  <input className="admin__input" placeholder="e.g. Rainbow Café" value={sponsorForm.business_name} maxLength={60}
                    onChange={e => setSponsorForm(f => ({ ...f, business_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="admin__label">Tagline <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(1 line, shown on the banner)</span></label>
                  <input className="admin__input" placeholder="e.g. Welcoming LGBTQ+ since 2019" value={sponsorForm.tagline} maxLength={100}
                    onChange={e => setSponsorForm(f => ({ ...f, tagline: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="admin__label">Website link</label>
                  <input className="admin__input" type="url" placeholder="https://yourbusiness.com" value={sponsorForm.link}
                    onChange={e => setSponsorForm(f => ({ ...f, link: e.target.value }))} />
                </div>
                {sponsorForm.plan === 'community' && (
                  <div className="form-group">
                    <label className="admin__label">Target city</label>
                    <select className="admin__select" value={sponsorForm.city} onChange={e => setSponsorForm(f => ({ ...f, city: e.target.value }))}>
                      <option value="">Select city</option>
                      {['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Kolkata','Ahmedabad','Jaipur','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                {sponsorError && <div className="stories__error">{sponsorError}</div>}
                <button className="btn btn-rainbow btn-full" type="submit" disabled={sponsorSaving || !sponsorForm.plan}>
                  {sponsorSaving ? 'Submitting…' : 'Submit for review'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
                  We review all banners before they go live. No payment until approved.
                </p>
              </form>
            )}
          </div>
        )}

        {/* Check-in */}
        {activeTab === 'scanner' && (
          <CheckInTab myEventIds={myEvents.map(e => e.id)} />
        )}

        {/* Stats */}
        {activeTab === 'stats' && (
          <div className="admin__form-section">
            <StatsTab myEvents={myEvents} />
          </div>
        )}

        {/* Submit Event */}
        {activeTab === 'add' && (
          <form className="admin__form" onSubmit={handleSubmit} noValidate>
            {submitted && <div className="admin__success">✅ Event submitted successfully! It's now live on Q2Q.</div>}
            {errors._form && <div className="admin__error" style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>{errors._form}</div>}

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
                    <button key={g.value} type="button" className={`admin__gradient-swatch ${form.gradient === g.value ? 'admin__gradient-swatch--selected' : ''}`}
                      style={{ background: g.value }} title={g.label} onClick={() => setField('gradient', g.value)} />
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
                    {form.tickets.length > 1 && <button type="button" className="admin__ticket-remove" onClick={() => removeTicketRow(i)}>✕</button>}
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
              <button type="submit" className="btn btn-primary btn-lg">Publish Event on Q2Q</button>
              <p className="admin__submit-note">Your event will be live immediately on the listings page.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
