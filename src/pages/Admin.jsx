import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CITIES, CATEGORIES, formatDate } from '../data/events';
import OrganizerDashboard from '../components/OrganizerDashboard';
import ConfirmDialog from '../components/ConfirmDialog';
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
  const totalCheckedIn= checkins.size;

  // per-event breakdown
  const perEvent = myEvents.map(ev => {
    const evBookings = active.filter(b => b.event_id === ev.id);
    const evCancelled = cancelled.filter(b => b.event_id === ev.id);
    const tickets  = evBookings.reduce((s, b) => s + (b.tickets || []).reduce((a, t) => a + t.qty, 0), 0);
    const ciCount  = evBookings.filter(b => checkins.has(b.id)).length;
    const isPast   = ev.date && ev.date < new Date().toISOString().slice(0, 10);
    return { ev, tickets, ciCount, cancelled: evCancelled.length, isPast };
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
        {tile('RSVPs', totalTickets)}
        {tile('Checked In', totalCheckedIn)}
        {tile('Cancelled', cancelled.length)}
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
                {['Event', 'Date', 'RSVPs', 'Checked In', 'Cancelled'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perEvent.map(({ ev, tickets, ciCount, cancelled: evCancelled, isPast }) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)', opacity: isPast ? 0.6 : 1 }}>
                  <td style={{ padding: '12px 12px', color: 'var(--text)', fontWeight: 600, maxWidth: 200 }}>
                    {ev.title}
                    {isPast && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-muted)' }}>Past</span>}
                  </td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(ev.date)}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{tickets}</td>
                  <td style={{ padding: '12px 12px', color: tickets > 0 ? 'var(--success, #34d399)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{ciCount}</td>
                  <td style={{ padding: '12px 12px', color: evCancelled > 0 ? '#f87171' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{evCancelled}</td>
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

function FundraisersTab({ user }) {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [saveOk, setSaveOk]           = useState(false);
  const [form, setForm] = useState({ title: '', cause: '', target: '', end_date: '', payout_upi: '', payout_note: '' });

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('fundraisers').select('*')
      .eq('organizer_id', user.id).order('created_at', { ascending: false });
    setFundraisers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user.id]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaveError('');
    if (!form.title.trim()) { setSaveError('Campaign title is required.'); return; }
    if (!form.cause.trim()) { setSaveError('Campaign story is required.'); return; }
    if (!form.target || isNaN(form.target) || Number(form.target) < 1) { setSaveError('Enter a valid target amount.'); return; }

    setSaving(true);
    const { error } = await supabase.from('fundraisers').insert({
      title:          form.title.trim(),
      cause:          form.cause.trim(),
      organizer_id:   user.id,
      organizer_name: user.user_metadata?.name || user.email.split('@')[0],
      target_amount:  Number(form.target),
      end_date:       form.end_date || null,
      status:         'active',
      payout_upi:     form.payout_upi.trim() || null,
      payout_note:    form.payout_note.trim() || null,
    });
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSaveOk(true);
    setShowForm(false);
    setForm({ title: '', cause: '', target: '', end_date: '', payout_upi: '', payout_note: '' });
    load();
    setTimeout(() => setSaveOk(false), 4000);
  }

  const pct = (f) => Math.min(100, Math.round((f.collected_amount / f.target_amount) * 100));

  return (
    <div className="admin__form-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Your Fundraisers</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(v => !v); setSaveError(''); }}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {saveOk && <div className="admin__success" style={{ marginBottom: 16 }}>Campaign created! It's now live on the Fundraisers page.</div>}

      {showForm && (
        <form className="admin__form" onSubmit={handleCreate} noValidate style={{ marginBottom: 32 }}>
          <div className="admin__form-section" style={{ marginTop: 0 }}>
            <h2>New Fundraiser</h2>
            <div className="form-group">
              <label>Campaign Title *</label>
              <input type="text" placeholder="e.g. Pride Legal Aid Fund 2026" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Campaign Story *</label>
              <textarea rows={5} placeholder="Describe the cause, why it matters, and how donations will be used…"
                value={form.cause} onChange={e => setForm(f => ({ ...f, cause: e.target.value }))} />
            </div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label>Target Amount (₹) *</label>
                <input type="number" min="1" placeholder="50000" value={form.target}
                  onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>End Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                💳 <strong>Payout details</strong> — Q2Q will transfer collected donations to you. Add your UPI ID so we can send it quickly.
              </p>
              <div className="form-group">
                <label>Your UPI ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(for receiving donations)</span></label>
                <input type="text" placeholder="yourname@upi" value={form.payout_upi}
                  onChange={e => setForm(f => ({ ...f, payout_upi: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Bank transfer note <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — account no, IFSC, etc.)</span></label>
                <input type="text" placeholder="e.g. HDFC 1234567890 HDFC0001234" value={form.payout_note}
                  onChange={e => setForm(f => ({ ...f, payout_note: e.target.value }))} />
              </div>
            </div>
            {saveError && <div className="admin__error" style={{ marginBottom: 12 }}>{saveError}</div>}
            <div className="admin__submit-row">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Launch Campaign'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading campaigns…</p>
      ) : fundraisers.length === 0 ? (
        <div className="empty-state" style={{ paddingBlock: 40 }}>
          <div className="empty-state__icon">💚</div>
          <h3>No campaigns yet</h3>
          <p>Click "+ New Campaign" to launch your first fundraiser.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fundraisers.map(f => (
            <div key={f.id} style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{f.title}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {f.donor_count} {f.donor_count === 1 ? 'donor' : 'donors'} · ₹{f.collected_amount.toLocaleString('en-IN')} raised
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                  background: f.status === 'active' ? 'rgba(16,185,129,.12)' : 'rgba(255,255,255,.06)',
                  color:      f.status === 'active' ? '#10b981'              : 'var(--text-muted)' }}>
                  {f.status}
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--border-2)', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: 100, width: `${pct(f)}%`, minWidth: 4 }} />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                {pct(f)}% of ₹{f.target_amount.toLocaleString('en-IN')} goal
                {f.end_date ? ` · ends ${new Date(f.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { allEvents, addEvent, user, signInWithPassword, resetPassword, signOut, authLoading } = useApp();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn,  setSigningIn]  = useState(false);
  const [resetSent,  setResetSent]  = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(null);

  const [activeTab,     setActiveTab]     = useState('list');
  const [eventFilter,   setEventFilter]   = useState('upcoming');
  const [form,          setForm]          = useState(BLANK_EVENT);
  const [errors,        setErrors]        = useState({});
  const [submitted,     setSubmitted]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dashInitialTab, setDashInitialTab] = useState('attendees');

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
    if (forgotMode) {
      const { error } = await resetPassword(email);
      setSigningIn(false);
      if (error) setLoginError(error.message);
      else setResetSent(true);
      return;
    }
    const { error } = await signInWithPassword(email, password);
    setSigningIn(false);
    if (error) setLoginError('Incorrect email or password.');
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
    const dateOptions = form.dateOptionsRaw
      ? form.dateOptionsRaw.split('\n').map(s => s.trim()).filter(Boolean).map(date => ({ date, time: form.time, endTime: form.endTime }))
      : null;
    const eventData = {
      ...form,
      tickets: form.tickets.map((t, i) => ({
        id: `t${i + 1}`, type: t.type, price: Number(t.price),
        description: t.description, available: Number(t.available) || 100,
      })),
      tags: [form.category.toLowerCase()],
      attendees: 0,
      dateOptions: dateOptions && dateOptions.length > 1 ? dateOptions : null,
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
  // Organiser portal requires email/password login — Google OAuth = community user
  const isOrganiserAccount = user?.app_metadata?.provider === 'email';
  if (!user || !isOrganiserAccount) {
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

            {resetSent ? (
              <div className="admin-login__sent">
                <p><strong>Reset link sent</strong></p>
                <p className="admin-login__sent-sub">Check <strong>{email}</strong> for a password reset link.</p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => { setResetSent(false); setForgotMode(false); }}>
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="adm-email">Email</label>
                    <input id="adm-email" type="email" placeholder="you@yourorg.in" value={email}
                      onChange={e => { setEmail(e.target.value); setLoginError(''); }} autoComplete="email" />
                  </div>
                  {!forgotMode && (
                    <div className="form-group">
                      <label htmlFor="adm-pass">Password</label>
                      <input id="adm-pass" type="password" placeholder="••••••••" value={password}
                        onChange={e => { setPassword(e.target.value); setLoginError(''); }} autoComplete="current-password" />
                    </div>
                  )}
                  {loginError && <span className="admin__error" style={{ display: 'block', marginBottom: 12 }}>{loginError}</span>}
                  <button type="submit" className="btn btn-rainbow btn-full btn-lg" disabled={signingIn || !email || (!forgotMode && !password)}>
                    {signingIn ? 'Please wait…' : forgotMode ? 'Send reset link' : 'Sign in'}
                  </button>
                </form>

                <div className="admin-login__switch">
                  {!forgotMode
                    ? <button type="button" onClick={() => { setForgotMode(true); setLoginError(''); }}>Forgot password?</button>
                    : <button type="button" onClick={() => { setForgotMode(false); setLoginError(''); }}>Back to sign in</button>
                  }
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
          <OrganizerDashboard
            event={selectedEvent}
            initialTab={dashInitialTab}
            onBack={() => { setSelectedEvent(null); setDashInitialTab('attendees'); }}
            onDelete={() => { setSelectedEvent(null); setDashInitialTab('attendees'); }}
          />
        </div>
      </div>
    );
  }

  // ── Main organiser portal ────────────────────────────────────────────────────
  const myEvents = allEvents.filter(e => e.organizerId === user?.id);
  const today = new Date().toISOString().slice(0, 10);
  const filteredEvents = myEvents.filter(ev => {
    if (eventFilter === 'upcoming') return !ev.date || ev.date >= today;
    if (eventFilter === 'past')     return ev.date && ev.date < today;
    return true;
  });

  return (
    <div className="admin fade-up">
      <div className="admin__hero">
        <div className="container admin__hero-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1>Organizer Portal</h1>
            <p>Manage your queer events on Q2Q</p>
          </div>
          <button className="btn btn-ghost btn-sm"
            onClick={() => setConfirmDialog({ title: 'Sign out', action: 'Sign out of your Organizer Portal', confirmLabel: 'Sign out', fn: signOut })}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
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
          {/* scanner tab removed — check-in is inline */}
          <button className={`admin__tab ${activeTab === 'add'      ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('add')}>
            + Submit New Event
          </button>
          <button className={`admin__tab ${activeTab === 'advertise'? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('advertise')}>
            ✦ Advertise
          </button>
          <button className={`admin__tab ${activeTab === 'stats' ? 'admin__tab--active' : ''}`}
            onClick={() => setActiveTab('stats')}>
            📊 Stats
          </button>
        </div>

        {/* My Events */}
        {activeTab === 'list' && (
          <div className="admin__list">
            {/* Past / Upcoming filter */}
            {myEvents.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {[['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setEventFilter(val)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 13,
                      fontWeight: 600,
                      border: eventFilter === val ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: eventFilter === val ? 'var(--accent)' : 'transparent',
                      color: eventFilter === val ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                    <span style={{ marginLeft: 6, opacity: 0.7, fontWeight: 400 }}>
                      ({myEvents.filter(ev => {
                        if (val === 'upcoming') return !ev.date || ev.date >= today;
                        if (val === 'past')     return ev.date && ev.date < today;
                        return true;
                      }).length})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🎟️</div>
                {myEvents.length === 0 ? (
                  <>
                    <h3>No events yet</h3>
                    <p>Submit your first event using the <strong>+ Submit New Event</strong> tab above.</p>
                  </>
                ) : (
                  <>
                    <h3>No {eventFilter === 'all' ? '' : eventFilter} events</h3>
                    <p>Switch to <strong>All</strong> to see all your events.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="admin__events-grid">
                {filteredEvents.map(event => {
                  const isPast = event.date && event.date < today;
                  return (
                    <div key={event.id} className="admin__event-card card" style={isPast || event.isCancelled ? { opacity: 0.7 } : {}}>
                      <div className="admin__event-banner" style={{ background: event.gradient }} />
                      <div className="admin__event-body">
                        <div className="admin__event-badges">
                          {event.isCancelled
                            ? <span className="badge" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>Cancelled</span>
                            : isPast
                              ? <span className="badge badge-gray">Past</span>
                              : <span className="badge badge-green">Live</span>}
                          <span className="badge badge-gray">{event.city}</span>
                          {event.boosted && <span className="badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.3)' }}>⚡ Boosted</span>}
                        </div>
                        <h3 className="admin__event-title">{event.title}</h3>
                        <p className="admin__event-meta">{formatDate(event.date)}</p>
                        <p className="admin__event-meta">{event.venue}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button className="admin__dashboard-btn" style={{ flex: 1 }} onClick={() => { setDashInitialTab('attendees'); setSelectedEvent(event); }}>
                            Dashboard →
                          </button>
                          {!isPast && (
                            <button className="admin__dashboard-btn" style={{ flex: 1, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }} onClick={() => { setDashInitialTab('verify'); setSelectedEvent(event); }}>
                              Scan →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <label>Recurring dates <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — for weekly/monthly events)</span></label>
                <textarea
                  rows={3}
                  placeholder={'One date per line, e.g.:\n2026-12-05\n2026-12-12\n2026-12-19'}
                  value={form.dateOptionsRaw || ''}
                  onChange={e => setField('dateOptionsRaw', e.target.value)}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Leave blank for a one-time event. Add dates to let guests pick which one to attend.</span>
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

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
}
