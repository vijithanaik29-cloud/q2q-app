import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
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

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { allEvents, addEvent, user, signIn, signOut, authLoading } = useApp();

  // ── Login state ──────────────────────────────────────────────────────────────
  const [email,         setEmail]         = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [signingIn,     setSigningIn]     = useState(false);
  const [linkSent,      setLinkSent]      = useState(false);
  const [resendCooldown,setResendCooldown]= useState(0);

  // ── TOTP 2FA gate ────────────────────────────────────────────────────────────
  const [totpVerified,   setTotpVerified]   = useState(false);
  const [totpConfigured, setTotpConfigured] = useState(null); // null=checking, false=needs setup, true=ready
  const [totpSetupData,  setTotpSetupData]  = useState(null); // { uri, secret } during first-time setup
  const [totpQr,         setTotpQr]         = useState('');
  const [totpToken,      setTotpToken]      = useState('');
  const [totpError,      setTotpError]      = useState('');
  const [totpChecking,   setTotpChecking]   = useState(false);

  // ── Tabs & add-event form ────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState('overview');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form,          setForm]          = useState(BLANK_EVENT);
  const [formErrors,    setFormErrors]    = useState({});
  const [submitted,     setSubmitted]     = useState(false);

  // ── Applications ─────────────────────────────────────────────────────────────
  const [applications,    setApplications]    = useState([]);
  const [appsLoading,     setAppsLoading]     = useState(false);
  const [appActionId,     setAppActionId]     = useState(null);
  const [confirmRejectId, setConfirmRejectId] = useState(null);

  // ── Bookings & refunds ───────────────────────────────────────────────────────
  const [bookings,         setBookings]         = useState([]);
  const [bookingsLoading,  setBookingsLoading]  = useState(false);
  const [refundingEvent,   setRefundingEvent]   = useState(null);
  const [refundResults,    setRefundResults]    = useState({});
  const [confirmRefundId,  setConfirmRefundId]  = useState(null);

  // ── Coupons ──────────────────────────────────────────────────────────────────
  const BLANK_COUPON = { code: '', discount_type: 'percent', discount_value: '', max_uses: '100', expires_at: '', event_id: '' };
  const [coupons,       setCoupons]       = useState([]);
  const [couponsLoading,setCouponsLoading]= useState(false);
  const [couponForm,    setCouponForm]    = useState(BLANK_COUPON);
  const [couponSaving,  setCouponSaving]  = useState(false);
  const [couponError,   setCouponError]   = useState('');
  const [couponSaved,   setCouponSaved]   = useState(false);

  // ── Influencers ──────────────────────────────────────────────────────────────
  const BLANK_INF = { email: '', name: '' };
  const [influencers,        setInfluencers]        = useState([]);
  const [influencersLoading, setInfluencersLoading] = useState(false);
  const [influencerForm,     setInfluencerForm]     = useState(BLANK_INF);
  const [influencerSaving,   setInfluencerSaving]   = useState(false);
  const [influencerError,    setInfluencerError]    = useState('');
  const [influencerSaved,    setInfluencerSaved]    = useState(false);

  // ── Stories ──────────────────────────────────────────────────────────────────
  const [stories,       setStories]       = useState([]);
  const [storiesLoading,setStoriesLoading]= useState(false);

  // ── Sponsor review ───────────────────────────────────────────────────────────
  const [allSponsorSubs, setAllSponsorSubs] = useState([]);
  const [sponsorSubsLoad,setSponsorSubsLoad]= useState(false);
  const [sponsorNotes,   setSponsorNotes]   = useState({});
  const [sponsorActing,  setSponsorActing]  = useState(null);

  // ── Fundraisers ──────────────────────────────────────────────────────────────
  const [allFundraisers,     setAllFundraisers]     = useState([]);
  const [fundraisersLoading, setFundraisersLoading] = useState(false);
  const [frActing,           setFrActing]           = useState(null);

  // ── Analytics ─────────────────────────────────────────────────────────────────
  const [analytics,        setAnalytics]        = useState(null);
  const [analyticsRange,   setAnalyticsRange]   = useState('90');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── QR Scanner ───────────────────────────────────────────────────────────────
  const [scannerActive, setScannerActive]  = useState(false);
  const [scannedBooking,setScannedBooking] = useState(null);
  const [scanError,     setScanError]      = useState('');
  const [scanCheckedIn, setScanCheckedIn]  = useState(false);
  const [scanChecking,  setScanChecking]   = useState(false);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const streamRef = useRef(null);

  // Non-superadmin → redirect to organiser portal
  useEffect(() => {
    if (user && user.email !== SUPERADMIN) navigate('/admin', { replace: true });
  }, [user]);

  // Check TOTP configured status once user is verified superadmin
  useEffect(() => {
    if (!user || user.email !== SUPERADMIN || totpVerified) return;
    supabase.functions.invoke('setup-totp', { body: { action: 'status' } }).then(({ data }) => {
      setTotpConfigured(data?.configured ?? false);
    });
  }, [user]);

  // Generate QR data URL when setup data arrives
  useEffect(() => {
    if (totpSetupData?.uri) {
      QRCode.toDataURL(totpSetupData.uri, { width: 220, margin: 2, color: { dark: '#000', light: '#fff' } })
        .then(setTotpQr);
    }
  }, [totpSetupData?.uri]);

  useEffect(() => {
    if (!totpVerified) return;
    if (activeTab === 'overview' || activeTab === 'applications') loadApplications();
    if (activeTab === 'bookings')     loadBookings();
    if (activeTab === 'coupons')      loadCoupons();
    if (activeTab === 'influencers')  loadInfluencers();
    if (activeTab === 'stories')      loadStories();
    if (activeTab === 'sponsors')     loadAllSponsorSubs();
    if (activeTab === 'fundraisers')  loadAllFundraisers();
    if (activeTab === 'analytics')    { loadApplications(); loadAnalytics(analyticsRange); }
  }, [user, activeTab, totpVerified]);

  useEffect(() => {
    if (totpVerified && activeTab === 'analytics') loadAnalytics(analyticsRange);
  }, [analyticsRange]);

  // ── Data loaders ─────────────────────────────────────────────────────────────
  async function loadApplications() {
    setAppsLoading(true);
    const { data } = await supabase.from('organizer_applications').select('*').order('created_at', { ascending: false });
    setApplications(data || []);
    setAppsLoading(false);
  }

  async function loadBookings() {
    setBookingsLoading(true);
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    setBookings(data || []);
    setBookingsLoading(false);
  }

  async function loadCoupons() {
    setCouponsLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
    setCouponsLoading(false);
  }

  async function loadInfluencers() {
    setInfluencersLoading(true);
    const { data } = await supabase.from('influencers').select('*').order('created_at', { ascending: false });
    setInfluencers(data || []);
    setInfluencersLoading(false);
  }

  async function loadStories() {
    setStoriesLoading(true);
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
    setStories(data || []);
    setStoriesLoading(false);
  }

  async function loadAllSponsorSubs() {
    setSponsorSubsLoad(true);
    const { data } = await supabase.from('sponsor_submissions').select('*').order('created_at', { ascending: false });
    setAllSponsorSubs(data || []);
    setSponsorSubsLoad(false);
  }

  async function loadAllFundraisers() {
    setFundraisersLoading(true);
    const { data } = await supabase.from('fundraisers').select('*').order('created_at', { ascending: false });
    setAllFundraisers(data || []);
    setFundraisersLoading(false);
  }

  async function loadAnalytics(rangeDays) {
    setAnalyticsLoading(true);
    const fromDate = rangeDays === 'all'
      ? null
      : new Date(Date.now() - Number(rangeDays) * 86400000).toISOString();

    let q = supabase
      .from('bookings')
      .select('id, attendee, total, status, created_at, event_title')
      .order('created_at', { ascending: true });
    if (fromDate) q = q.gte('created_at', fromDate);
    const { data: bData } = await q;
    const bookings = bData || [];

    const activeB = bookings.filter(b => b.status === 'active');
    const emailCounts = {};
    bookings.forEach(b => {
      const e = b.attendee?.email;
      if (e) emailCounts[e] = (emailCounts[e] || 0) + 1;
    });
    const uniqueEmails   = Object.keys(emailCounts);
    const repeatBookers  = uniqueEmails.filter(e => emailCounts[e] >= 2).length;
    const revenue        = activeB.reduce((s, b) => s + (b.total || 0), 0);

    // Month-by-month buckets
    const buckets = {};
    bookings.forEach(b => {
      const key = b.created_at.slice(0, 7);
      if (!buckets[key]) buckets[key] = { month: key, count: 0, revenue: 0, emails: new Set() };
      buckets[key].count++;
      if (b.status === 'active') buckets[key].revenue += (b.total || 0);
      if (b.attendee?.email) buckets[key].emails.add(b.attendee.email);
    });
    const months = Object.values(buckets)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ month: m.month, count: m.count, revenue: m.revenue, unique: m.emails.size }));

    setAnalytics({ total: bookings.length, uniqueBookers: uniqueEmails.length, repeatBookers, revenue, months });
    setAnalyticsLoading(false);
  }

  async function setFundraiserStatus(id, status) {
    setFrActing(id);
    await supabase.from('fundraisers').update({ status }).eq('id', id);
    setAllFundraisers(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    setFrActing(null);
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  async function handleApprove(app) {
    setAppActionId(app.id);
    const { error: inviteErr } = await supabase.functions.invoke('invite-organizer', {
      body: { email: app.email, name: app.name, app_id: app.id },
    });
    if (inviteErr) { alert('Could not send invite: ' + inviteErr.message); setAppActionId(null); return; }
    await supabase.from('organizer_applications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', app.id);
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
    setAppActionId(null);
  }

  async function handleReject(app) {
    setAppActionId(app.id);
    setConfirmRejectId(null);
    await supabase.from('organizer_applications').update({ status: 'rejected', rejected_at: new Date().toISOString() }).eq('id', app.id);
    await supabase.functions.invoke('send-rejection', { body: { email: app.email, name: app.name, org_name: app.org_name } });
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
    setAppActionId(null);
  }

  async function handleRefundEvent(eventId, eventTitle) {
    setConfirmRefundId(null);
    setRefundingEvent(eventId);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('refund-event', {
      body: { event_id: eventId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setRefundingEvent(null);
    if (error) { alert('Refund failed: ' + error.message); return; }
    setRefundResults(prev => ({ ...prev, [eventId]: data }));
    await loadBookings();
  }

  function groupBookingsByEvent(bookings) {
    const groups = {};
    for (const b of bookings) {
      if (!groups[b.event_id]) groups[b.event_id] = { event_id: b.event_id, event_title: b.event_title, bookings: [] };
      groups[b.event_id].bookings.push(b);
    }
    return Object.values(groups);
  }

  async function saveCoupon(e) {
    e.preventDefault();
    setCouponError('');
    if (!couponForm.code.trim()) { setCouponError('Code is required'); return; }
    if (!couponForm.discount_value || Number(couponForm.discount_value) <= 0) { setCouponError('Discount value must be > 0'); return; }
    if (couponForm.discount_type === 'percent' && Number(couponForm.discount_value) > 100) { setCouponError('Percent cannot exceed 100'); return; }
    setCouponSaving(true);
    const { error } = await supabase.from('coupons').insert({
      code:           couponForm.code.trim().toUpperCase(),
      discount_type:  couponForm.discount_type,
      discount_value: Number(couponForm.discount_value),
      max_uses:       Number(couponForm.max_uses) || 100,
      expires_at:     couponForm.expires_at || null,
      event_id:       couponForm.event_id || null,
    });
    setCouponSaving(false);
    if (error) { setCouponError(error.message); return; }
    setCouponForm(BLANK_COUPON);
    setCouponSaved(true);
    setTimeout(() => setCouponSaved(false), 3000);
    await loadCoupons();
  }

  async function toggleCoupon(id, active) {
    await supabase.from('coupons').update({ active: !active }).eq('id', id);
    await loadCoupons();
  }

  async function saveInfluencer(e) {
    e.preventDefault();
    setInfluencerError('');
    if (!influencerForm.email.trim()) { setInfluencerError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(influencerForm.email.trim())) { setInfluencerError('Invalid email'); return; }
    setInfluencerSaving(true);
    const { error } = await supabase.from('influencers').insert({ email: influencerForm.email.trim().toLowerCase(), name: influencerForm.name.trim() || null });
    setInfluencerSaving(false);
    if (error) { setInfluencerError(error.message); return; }
    setInfluencerForm(BLANK_INF);
    setInfluencerSaved(true);
    setTimeout(() => setInfluencerSaved(false), 3000);
    await loadInfluencers();
  }

  async function toggleInfluencer(id, active) {
    await supabase.from('influencers').update({ active: !active }).eq('id', id);
    await loadInfluencers();
  }

  async function moderateStory(id, status) {
    await supabase.from('stories').update({ status }).eq('id', id);
    await loadStories();
  }

  async function sponsorAction(id, action, note) {
    setSponsorActing(id);
    const updates = action === 'approve' ? { status: 'approved', review_note: note || null, approved_at: new Date().toISOString() }
      : action === 'reject' ? { status: 'rejected', review_note: note || null }
      : action === 'live'   ? { status: 'active',   active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
      : { status: 'pending', review_note: null };
    await supabase.from('sponsor_submissions').update(updates).eq('id', id);
    setSponsorActing(null);
    loadAllSponsorSubs();
  }

  async function toggleBoost(eventId, boosted) {
    await supabase.from('events').update({ boosted: !boosted }).eq('id', eventId);
    window.location.reload();
  }

  // ── Scanner ──────────────────────────────────────────────────────────────────
  function stopScanner() {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScannerActive(false);
  }

  async function startScanner() {
    setScannedBooking(null); setScanError(''); setScanCheckedIn(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScannerActive(true);
      scanLoop();
    } catch { setScanError('Camera access denied.'); }
  }

  function scanLoop() {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (code?.data) { stopScanner(); lookupBookingById(code.data); return; }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  async function lookupBookingById(bookingId) {
    setScanError(''); setScannedBooking(null); setScanCheckedIn(false);
    const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (error || !data) { setScanError(`Booking not found: ${bookingId}`); return; }
    const { data: ci } = await supabase.from('checkins').select('booking_id').eq('booking_id', bookingId).maybeSingle();
    setScannedBooking(data); setScanCheckedIn(!!ci);
  }

  async function doCheckIn(bookingId) {
    setScanChecking(true);
    await supabase.from('checkins').upsert({ booking_id: bookingId });
    setScanCheckedIn(true); setScanChecking(false);
  }

  // ── Add event form ───────────────────────────────────────────────────────────
  function setField(key, val) { setForm(p => ({ ...p, [key]: val })); if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: '' })); }
  function setTicket(i, key, val) { setForm(p => { const t = [...p.tickets]; t[i] = { ...t[i], [key]: val }; return { ...p, tickets: t }; }); }
  function addTicketRow() { setForm(p => ({ ...p, tickets: [...p.tickets, { type: '', price: '', description: '', available: '' }] })); }
  function removeTicketRow(i) { setForm(p => ({ ...p, tickets: p.tickets.filter((_, idx) => idx !== i) })); }

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
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    try {
      await addEvent({
        ...form,
        tickets: form.tickets.map((t, i) => ({ id: `t${i + 1}`, type: t.type, price: Number(t.price), description: t.description, available: Number(t.available) || 100 })),
        tags: [form.category.toLowerCase()], attendees: 0,
      });
      setSubmitted(true); setForm(BLANK_EVENT);
      setTimeout(() => { setSubmitted(false); setActiveTab('events'); }, 2000);
    } catch { setFormErrors(p => ({ ...p, _form: 'Failed to publish event.' })); }
  }

  // ── Login ─────────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true); setLoginError('');
    const { error } = await signIn(email, `${window.location.origin}/superadmin`);
    setSigningIn(false);
    if (error) setLoginError(error.message);
    else { setLinkSent(true); startResendCooldown(); }
  }

  function startResendCooldown() {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
    }, 1000);
  }

  async function resendLink() {
    setSigningIn(true); setLoginError('');
    const { error } = await signIn(email, `${window.location.origin}/superadmin`);
    setSigningIn(false);
    if (error) setLoginError(error.message);
    else startResendCooldown();
  }

  async function startTotpSetup() {
    setTotpChecking(true); setTotpError('');
    const { data, error } = await supabase.functions.invoke('setup-totp', { body: {} });
    setTotpChecking(false);
    if (error || !data?.uri) { setTotpError('Could not generate QR code. Try again.'); return; }
    setTotpSetupData(data);
    setTotpConfigured(false);
  }

  async function verifyTotp(e) {
    e.preventDefault();
    if (totpToken.length !== 6) { setTotpError('Enter the 6-digit code from your app'); return; }
    setTotpChecking(true); setTotpError('');
    const { data, error } = await supabase.functions.invoke('verify-totp', { body: { token: totpToken } });
    setTotpChecking(false);
    if (error || !data?.ok) {
      setTotpError('Incorrect code. Check your app and try again.');
      setTotpToken('');
    } else {
      setTotpVerified(true);
      setTotpSetupData(null);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="admin-login fade-up">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="admin-login fade-up">
        <div className="container admin-login__inner">
          <div className="admin-login__card card">
            <div className="admin-login__header">
              <div className="admin-login__icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/>
                  <path d="M18 8l2 2 4-4" strokeWidth="2"/>
                </svg>
              </div>
              <h1>Q2Q Control</h1>
              <p>Platform administration</p>
            </div>

            {linkSent ? (
              <div className="admin-login__sent">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <p><strong>Check your email</strong></p>
                <p className="admin-login__sent-sub">Sign-in link sent to <strong>{email}</strong>.</p>
                <button className="btn btn-rainbow btn-sm" style={{ marginTop: 16 }} onClick={resendLink} disabled={signingIn || resendCooldown > 0}>
                  {signingIn ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend link'}
                </button>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => { setLinkSent(false); setEmail(''); setResendCooldown(0); }}>
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="sa-email">Email</label>
                  <input id="sa-email" type="email" placeholder="your email" value={email}
                    onChange={e => { setEmail(e.target.value); setLoginError(''); }} autoComplete="email" />
                  {loginError && <span className="admin__error">{loginError}</span>}
                </div>
                <button type="submit" className="btn btn-rainbow btn-full btn-lg" disabled={signingIn || !email}>
                  {signingIn ? 'Sending…' : 'Send sign-in link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── TOTP gate ─────────────────────────────────────────────────────────────────
  if (!totpVerified) {
    // Still checking configuration status
    if (totpConfigured === null) {
      return (
        <div className="admin-login fade-up">
          <div className="container admin-login__inner">
            <div className="admin-login__card card" style={{ textAlign: 'center', padding: 48 }}>
              <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto' }} />
              <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>Checking security…</p>
            </div>
          </div>
        </div>
      );
    }

    // First-time setup: show QR code
    if (totpConfigured === false && !totpSetupData) {
      return (
        <div className="admin-login fade-up">
          <div className="container admin-login__inner">
            <div className="admin-login__card card">
              <div className="admin-login__header">
                <div className="admin-login__icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h1>Set up 2FA</h1>
                <p>Secure your superadmin portal with Google Authenticator</p>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                <strong style={{ color: 'var(--text)' }}>One-time setup.</strong> Install Google Authenticator or Authy on your phone, then click below to get your QR code.
              </div>
              {totpError && <div style={{ fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>{totpError}</div>}
              <button className="btn btn-rainbow btn-full btn-lg" onClick={startTotpSetup} disabled={totpChecking}>
                {totpChecking ? 'Generating…' : 'Generate QR Code'}
              </button>
              <p className="admin-login__note" style={{ marginTop: 16 }}>
                Signed in as {user.email} · <button className="btn-link" onClick={signOut}>Sign out</button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // First-time setup: QR code displayed, waiting for first code
    if (totpSetupData) {
      return (
        <div className="admin-login fade-up">
          <div className="container admin-login__inner">
            <div className="admin-login__card card">
              <div className="admin-login__header">
                <div className="admin-login__icon" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--success)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01"/>
                  </svg>
                </div>
                <h1>Scan QR Code</h1>
                <p>Open Google Authenticator → tap + → Scan QR code</p>
              </div>

              {totpQr ? (
                <div style={{ textAlign: 'center', margin: '0 auto 20px', background: '#fff', padding: 12, borderRadius: 12, width: 'fit-content' }}>
                  <img src={totpQr} alt="TOTP QR Code" style={{ width: 200, height: 200, display: 'block' }} />
                </div>
              ) : (
                <div style={{ height: 224, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <div className="spinner" style={{ width: 24, height: 24 }} />
                </div>
              )}

              <details style={{ marginBottom: 20 }}>
                <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>Can't scan? Enter key manually</summary>
                <div style={{ marginTop: 10, background: 'var(--surface)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.08em', wordBreak: 'break-all', color: 'var(--text)' }}>
                  {totpSetupData.secret}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>In Google Authenticator: + → Enter a setup key → paste the key above. Account: Q2Q Superadmin, Type: Time based.</p>
              </details>

              <form onSubmit={verifyTotp}>
                <div className="form-group">
                  <label>Enter the 6-digit code from your app to confirm setup</label>
                  <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="000000" value={totpToken} autoFocus autoComplete="one-time-code"
                    style={{ fontSize: 24, letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'monospace' }}
                    onChange={e => { setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpError(''); }} />
                  {totpError && <span className="admin__error">{totpError}</span>}
                </div>
                <button type="submit" className="btn btn-rainbow btn-full btn-lg" disabled={totpChecking || totpToken.length !== 6}>
                  {totpChecking ? 'Verifying…' : 'Confirm & Enter Portal'}
                </button>
              </form>
              <p className="admin-login__note" style={{ marginTop: 16 }}>
                <button className="btn-link" onClick={() => { setTotpSetupData(null); setTotpQr(''); setTotpError(''); }}>← Back</button>
                {' · '}
                <button className="btn-link" onClick={signOut}>Sign out</button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // TOTP configured — enter 6-digit code
    return (
      <div className="admin-login fade-up">
        <div className="container admin-login__inner">
          <div className="admin-login__card card">
            <div className="admin-login__header">
              <div className="admin-login__icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1>Two-Factor Auth</h1>
              <p>Open Google Authenticator and enter the 6-digit code</p>
            </div>
            <form onSubmit={verifyTotp}>
              <div className="form-group">
                <label htmlFor="totp-token">Authenticator code</label>
                <input id="totp-token" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  placeholder="000000" value={totpToken} autoFocus autoComplete="one-time-code"
                  style={{ fontSize: 28, letterSpacing: '0.35em', textAlign: 'center', fontFamily: 'monospace' }}
                  onChange={e => { setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpError(''); }} />
                {totpError && <span className="admin__error">{totpError}</span>}
              </div>
              <button type="submit" className="btn btn-rainbow btn-full btn-lg" disabled={totpChecking || totpToken.length !== 6}>
                {totpChecking ? 'Verifying…' : 'Enter Admin Portal'}
              </button>
            </form>
            <p className="admin-login__note" style={{ marginTop: 16 }}>
              Signed in as {user.email} · <button className="btn-link" onClick={signOut}>Sign out</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Event dashboard drill-down ────────────────────────────────────────────────
  if (selectedEvent) {
    return (
      <div className="admin fade-up">
        <div className="admin__hero">
          <div className="container admin__hero-inner">
            <h1>Dashboard</h1>
            <p>Sales, attendees, and payouts for this event</p>
          </div>
        </div>
        <div className="container admin__body">
          <OrganizerDashboard event={selectedEvent} onBack={() => setSelectedEvent(null)} />
        </div>
      </div>
    );
  }

  // ── Main superadmin portal ────────────────────────────────────────────────────
  const pendingApps    = applications.filter(a => a.status === 'pending');
  const pendingSponsors= allSponsorSubs.filter(s => s.status === 'pending');
  const pendingStories = stories.filter(s => s.status === 'pending');

  return (
    <div className="admin fade-up">
      <div className="admin__hero" style={{ borderBottom: '2px solid rgba(139,92,246,0.3)' }}>
        <div className="container admin__hero-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1>Q2Q Control</h1>
            <p>Platform administration</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={signOut} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            Sign out
          </button>
        </div>
      </div>

      <div className="container admin__body">
        {/* Tabs */}
        <div className="admin__tabs">
          <button className={`admin__tab admin__tab--super ${activeTab === 'overview'     ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'analytics'   ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analytics</button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'events'       ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('events')}>Events ({allEvents.length})</button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'add'          ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('add')}>+ Add Event</button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'applications' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('applications')}>
            Applications {pendingApps.length > 0 && <span className="admin__tab-badge">{pendingApps.length}</span>}
          </button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'bookings'     ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('bookings')}>🛡 Bookings</button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'sponsors'     ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('sponsors')}>
            Sponsor Review {pendingSponsors.length > 0 && <span className="admin__tab-badge">{pendingSponsors.length}</span>}
          </button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'coupons'      ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('coupons')}>🏷 Coupons</button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'influencers'  ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('influencers')}>🎟 Influencers</button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'stories'      ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('stories')}>
            ✍️ Stories {pendingStories.length > 0 && <span className="admin__tab-badge">{pendingStories.length}</span>}
          </button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'scanner'      ? 'admin__tab--active' : ''}`}
            onClick={() => { stopScanner(); setScannedBooking(null); setScanError(''); setScanCheckedIn(false); setActiveTab('scanner'); }}>
            📷 Scanner
          </button>
          <button className={`admin__tab admin__tab--super ${activeTab === 'fundraisers' ? 'admin__tab--active' : ''}`} onClick={() => setActiveTab('fundraisers')}>
            💚 Fundraisers
          </button>
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (() => {
          const today          = new Date().toISOString().slice(0, 10);
          const approved       = applications.filter(a => a.status === 'approved');
          const declined       = applications.filter(a => a.status === 'rejected');
          const todayEvents    = allEvents.filter(e => e.date === today);
          const upcomingEvents = allEvents.filter(e => e.date > today);
          const pastEvents     = allEvents.filter(e => e.date < today);
          return (
            <div className="admin__overview">
              <div className="admin__overview-section">
                <h2 className="admin__overview-heading">Applications</h2>
                <div className="admin__overview-grid">
                  <div className="admin__overview-card admin__overview-card--alert" onClick={() => setActiveTab('applications')} style={{ cursor: pendingApps.length ? 'pointer' : 'default' }}>
                    <div className="admin__overview-num">{pendingApps.length}</div>
                    <div className="admin__overview-label">Pending review</div>
                    {pendingApps.length > 0 && <div className="admin__overview-action">Review now →</div>}
                  </div>
                  <div className="admin__overview-card"><div className="admin__overview-num">{approved.length}</div><div className="admin__overview-label">Approved</div></div>
                  <div className="admin__overview-card"><div className="admin__overview-num">{declined.length}</div><div className="admin__overview-label">Declined</div></div>
                </div>
              </div>
              <div className="admin__overview-section">
                <h2 className="admin__overview-heading">Events</h2>
                <div className="admin__overview-grid">
                  <div className="admin__overview-card admin__overview-card--today">
                    <div className="admin__overview-num">{todayEvents.length}</div>
                    <div className="admin__overview-label">Happening today</div>
                    {todayEvents.length > 0 && <ul className="admin__overview-list">{todayEvents.map(e => <li key={e.id}>{e.title}</li>)}</ul>}
                  </div>
                  <div className="admin__overview-card"><div className="admin__overview-num">{upcomingEvents.length}</div><div className="admin__overview-label">Upcoming</div></div>
                  <div className="admin__overview-card"><div className="admin__overview-num">{pastEvents.length}</div><div className="admin__overview-label">Past</div></div>
                  <div className="admin__overview-card"><div className="admin__overview-num">{allEvents.length}</div><div className="admin__overview-label">Total</div></div>
                </div>
              </div>
              {pendingApps.length > 0 && (
                <div className="admin__overview-section">
                  <h2 className="admin__overview-heading">Pending Applications</h2>
                  <div className="admin__overview-apps">
                    {pendingApps.slice(0, 5).map(app => (
                      <div key={app.id} className="admin__overview-app-row">
                        <div>
                          <div className="admin__overview-app-name">{app.org_name || app.name}</div>
                          <div className="admin__overview-app-meta">{app.city} · {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('applications')}>Review</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Analytics ────────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (() => {
          const approved = applications.filter(a => a.status === 'approved');
          const declined = applications.filter(a => a.status === 'rejected');
          const pending  = applications.filter(a => a.status === 'pending');

          const RANGES = [
            { value: '30',  label: 'Last 30 days' },
            { value: '90',  label: 'Last 90 days' },
            { value: '365', label: 'Last 12 months' },
            { value: 'all', label: 'All time' },
          ];

          const maxCount = analytics ? Math.max(...analytics.months.map(m => m.count), 1) : 1;
          const fmtMonth = (key) => {
            const [y, m] = key.split('-');
            return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          };

          return (
            <div style={{ maxWidth: 820 }}>
              {/* Range selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Range</span>
                {RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setAnalyticsRange(r.value)}
                    style={{
                      padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: analyticsRange === r.value ? '1px solid #8B5CF6' : '1px solid var(--border-2)',
                      background: analyticsRange === r.value ? '#8B5CF6' : 'transparent',
                      color: analyticsRange === r.value ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >{r.label}</button>
                ))}
                {analyticsLoading && <div className="spinner" style={{ width: 16, height: 16, marginLeft: 8 }} />}
              </div>

              {/* Bookings metrics */}
              <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Bookings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 36 }}>
                {[
                  { label: 'Total Bookings',   value: analytics?.total         ?? '—', color: '#8B5CF6' },
                  { label: 'Unique Bookers',   value: analytics?.uniqueBookers ?? '—', color: 'var(--accent)' },
                  { label: 'Repeat Bookers',   value: analytics?.repeatBookers ?? '—', color: '#F59E0B' },
                  { label: 'Revenue',
                    value: analytics ? `₹${analytics.revenue.toLocaleString('en-IN')}` : '—',
                    color: 'var(--success)', small: true },
                ].map(tile => (
                  <div key={tile.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
                    <div style={{ fontSize: tile.small ? 22 : 28, fontWeight: 900, color: tile.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{tile.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginTop: 6 }}>{tile.label}</div>
                  </div>
                ))}
              </div>

              {/* Org metrics */}
              <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Organisations</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 36 }}>
                {[
                  { label: 'Verified Orgs',  value: approved.length, color: 'var(--success)' },
                  { label: 'Declined Orgs',  value: declined.length, color: 'var(--error)' },
                  { label: 'Pending Review', value: pending.length,  color: 'var(--accent)',
                    action: pending.length > 0 ? () => setActiveTab('applications') : null },
                ].map(tile => (
                  <div key={tile.label}
                    onClick={tile.action || undefined}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', cursor: tile.action ? 'pointer' : 'default' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: tile.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{tile.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginTop: 6 }}>{tile.label}</div>
                    {tile.action && tile.value > 0 && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>Review now →</div>}
                  </div>
                ))}
              </div>

              {/* Month-by-month */}
              {analytics?.months?.length > 0 && (
                <>
                  <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Month-by-Month Bookings</h3>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    {/* Bar chart */}
                    <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                      {analytics.months.map(m => (
                        <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          <div style={{ width: '100%', background: '#8B5CF6', borderRadius: '4px 4px 0 0', opacity: 0.85,
                            height: `${Math.max(4, Math.round((m.count / maxCount) * 72))}px`,
                            transition: 'height 0.3s ease' }} title={`${m.count} bookings`} />
                        </div>
                      ))}
                    </div>
                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderTop: '1px solid var(--border)' }}>
                            {['Month', 'Bookings', 'Unique Users', 'Revenue'].map(h => (
                              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...analytics.months].reverse().map((m, i) => (
                            <tr key={m.month} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                              <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmtMonth(m.month)}</td>
                              <td style={{ padding: '10px 16px', fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{m.count}</td>
                              <td style={{ padding: '10px 16px', fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{m.unique}</td>
                              <td style={{ padding: '10px 16px', fontVariantNumeric: 'tabular-nums', color: 'var(--success)' }}>₹{m.revenue.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {!analyticsLoading && analytics?.months?.length === 0 && (
                <div className="empty-state" style={{ paddingBlock: 40 }}>
                  <div className="empty-state__icon">📊</div>
                  <h3>No data yet</h3>
                  <p>Bookings will appear here once they start coming in.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── All Events ────────────────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <div className="admin__list">
            <div className="admin__events-grid">
              {allEvents.map(event => (
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
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="admin__dashboard-btn" style={{ flex: 1 }} onClick={() => setSelectedEvent(event)}>View Dashboard →</button>
                      <button onClick={() => toggleBoost(event.id, event.boosted)} title={event.boosted ? 'Remove boost' : 'Boost'}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-2)', background: event.boosted ? 'rgba(234,179,8,0.12)' : 'var(--bg)', color: event.boosted ? '#ca8a04' : 'var(--text-muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>⚡</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Applications ──────────────────────────────────────────────────── */}
        {activeTab === 'applications' && (
          <div className="admin__applications">
            {appsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : applications.length === 0 ? (
              <div className="empty-state"><div className="empty-state__icon">📬</div><h3>No applications yet</h3><p>Share <strong>/apply</strong> with organizers to get started.</p></div>
            ) : (
              <div className="admin__app-list">
                {applications.map(app => (
                  <div key={app.id} className={`admin__app-card card admin__app-card--${app.status}`}>
                    <div className="admin__app-top">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                          <div>
                            <div className="admin__app-name">{app.name} · <span className="admin__app-org">{app.org_name}</span></div>
                            <div className="admin__app-meta" style={{ marginTop: 2 }}>{app.email} · {app.phone} · {app.city}</div>
                          </div>
                          <span className={`admin__app-status admin__app-status--${app.status}`}>{app.status}</span>
                        </div>
                        {app.event_types?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {app.event_types.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', color: 'var(--accent)', border: '1px solid rgba(139,92,246,0.2)' }}>{t}</span>)}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                          {app.food_drinks     && <span>🍹 {app.food_drinks}</span>}
                          {app.seating_type    && <span>🪑 {app.seating_type}</span>}
                          {app.age_restriction && <span>🔞 {app.age_restriction}</span>}
                          {app.dress_code      && <span>👗 {app.dress_code}</span>}
                          {app.accessibility   && <span>♿ {app.accessibility}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 }}>
                          {app.instagram && <a href={app.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>📸 {app.instagram}</a>}
                          {app.facebook  && <a href={app.facebook}  target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>👥 {app.facebook}</a>}
                          {app.website   && <a href={app.website}   target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>🌐 {app.website}</a>}
                        </div>
                        {app.message && <p className="admin__app-msg" style={{ marginTop: 10 }}>"{app.message}"</p>}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </div>
                    {app.status === 'pending' && (
                      <div className="admin__app-actions">
                        <button className="btn btn-primary btn-sm" disabled={appActionId === app.id} onClick={() => { setConfirmRejectId(null); handleApprove(app); }}>
                          {appActionId === app.id && confirmRejectId !== app.id ? 'Sending invite…' : 'Approve & Send Invite'}
                        </button>
                        {confirmRejectId === app.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>Reject this application?</span>
                            <button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', border: 'none' }} disabled={appActionId === app.id} onClick={() => handleReject(app)}>
                              {appActionId === app.id ? 'Rejecting…' : 'Yes, Reject'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmRejectId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" disabled={appActionId === app.id} onClick={() => setConfirmRejectId(app.id)} style={{ color: 'var(--error)' }}>
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                    {app.status === 'approved' && <p className="admin__app-done">✓ Invite sent.</p>}
                    {app.status === 'rejected' && <p className="admin__app-done" style={{ color: 'var(--error)' }}>✕ Rejected</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bookings & Refunds ────────────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="admin__bookings">
            <div className="admin__bookings-header">
              <h2>All Bookings</h2>
              <button className="btn btn-ghost btn-sm" onClick={loadBookings}>↻ Refresh</button>
            </div>
            {bookingsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
            ) : bookings.length === 0 ? (
              <div className="empty-state"><div className="empty-state__icon">🎟️</div><h3>No bookings yet</h3></div>
            ) : (
              groupBookingsByEvent(bookings).map(group => {
                const active   = group.bookings.filter(b => b.status === 'active');
                const refunded = group.bookings.filter(b => b.status === 'refunded');
                const revenue  = active.reduce((s, b) => s + (b.total || 0), 0);
                const allPaid  = group.bookings.every(b => b.payout_released);
                const result   = refundResults[group.event_id];
                return (
                  <div key={group.event_id} className="admin__booking-group card">
                    <div className="admin__booking-group-header">
                      <div>
                        <div className="admin__booking-event-title">{group.event_title}</div>
                        <div className="admin__booking-event-stats">
                          <span className="admin__booking-stat admin__booking-stat--active">{active.length} active</span>
                          {refunded.length > 0 && <span className="admin__booking-stat admin__booking-stat--refunded">{refunded.length} refunded</span>}
                          <span className="admin__booking-stat">₹{revenue.toLocaleString('en-IN')} held</span>
                          <span className={`admin__booking-payout ${allPaid ? 'admin__booking-payout--released' : ''}`}>{allPaid ? '✓ Payout released' : '⏳ Payout held'}</span>
                        </div>
                      </div>
                      {active.length > 0 && (
                        confirmRefundId === group.event_id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>Refund all {active.length} bookings?</span>
                            <button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', border: 'none' }} disabled={refundingEvent === group.event_id}
                              onClick={() => handleRefundEvent(group.event_id, group.event_title)}>
                              {refundingEvent === group.event_id ? 'Refunding…' : 'Yes, Refund All'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmRefundId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn btn-sm admin__refund-btn" disabled={refundingEvent === group.event_id}
                            onClick={() => setConfirmRefundId(group.event_id)}>
                            {refundingEvent === group.event_id ? 'Refunding…' : `Cancel & Refund ${active.length} bookings`}
                          </button>
                        )
                      )}
                    </div>
                    {result && <div className="admin__refund-result">✓ Refunded {result.refunded} bookings · ₹{(result.total_amount || 0).toLocaleString('en-IN')} returned</div>}
                    <div className="admin__booking-table">
                      <div className="admin__booking-thead"><span>Ref</span><span>Attendee</span><span>Tickets</span><span>Amount</span><span>Status</span><span>Date</span></div>
                      {group.bookings.map(b => (
                        <div key={b.id} className={`admin__booking-row admin__booking-row--${b.status}`}>
                          <span className="admin__booking-id">{b.id}</span>
                          <span><div>{b.attendee?.name}</div><div className="admin__booking-email">{b.attendee?.email}</div></span>
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

        {/* ── Sponsor Review ────────────────────────────────────────────────── */}
        {activeTab === 'sponsors' && (
          <div className="admin__form-section" style={{ maxWidth: 720 }}>
            <h2>Sponsor Review</h2>
            {sponsorSubsLoad ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
              : allSponsorSubs.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No submissions yet.</p>
              : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {allSponsorSubs.map(s => (
                  <div key={s.id} style={{ background: 'var(--surface)', border: `1px solid ${s.status === 'active' ? 'var(--success)' : s.status === 'approved' ? 'rgba(139,92,246,0.3)' : s.status === 'rejected' ? 'var(--error)' : 'var(--border-2)'}`, borderRadius: 10, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 99,
                        background: s.status === 'active' ? 'var(--success-dim)' : s.status === 'approved' ? 'rgba(139,92,246,0.1)' : s.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'var(--accent-dim)',
                        color:      s.status === 'active' ? 'var(--success)'     : s.status === 'approved' ? '#8B5CF6'                 : s.status === 'rejected' ? 'var(--error)'             : 'var(--accent)',
                      }}>{s.status}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{s.plan === 'community' ? 'Community · ₹999' : 'Pride · ₹2,499'}</span>
                      {s.city && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.city}</span>}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{s.organiser_email}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{s.business_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 3 }}>{s.tagline}</div>
                    <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>{s.link}</a>
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <textarea placeholder="Note to organiser (optional)" value={sponsorNotes[s.id] || ''} rows={2}
                        onChange={e => setSponsorNotes(n => ({ ...n, [s.id]: e.target.value }))}
                        style={{ flex: 1, minWidth: 200, fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {s.status === 'pending' && <>
                          <button className="btn btn-rainbow btn-sm" disabled={sponsorActing === s.id} onClick={() => sponsorAction(s.id, 'approve', sponsorNotes[s.id])}>Approve</button>
                          <button className="btn btn-outline btn-sm" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} disabled={sponsorActing === s.id} onClick={() => sponsorAction(s.id, 'reject', sponsorNotes[s.id])}>Request edits</button>
                        </>}
                        {s.status === 'approved' && <button className="btn btn-primary btn-sm" disabled={sponsorActing === s.id} onClick={() => sponsorAction(s.id, 'live', '')}>Set Live ✓</button>}
                        {s.status === 'active'   && <button className="btn btn-outline btn-sm" disabled={sponsorActing === s.id} onClick={() => sponsorAction(s.id, 'reject', 'Deactivated.')}>Deactivate</button>}
                        {s.status === 'rejected' && <button className="btn btn-outline btn-sm" disabled={sponsorActing === s.id} onClick={() => sponsorAction(s.id, 'pending', '')}>Reopen</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Coupons ───────────────────────────────────────────────────────── */}
        {activeTab === 'coupons' && (
          <div className="admin__form-section" style={{ maxWidth: 640 }}>
            <h2>Coupon Codes</h2>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Create new coupon</div>
              <form onSubmit={saveCoupon} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="admin__label">Code *</label>
                    <input className="admin__input" placeholder="e.g. PRIDE25" value={couponForm.code}
                      style={{ fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                      onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className="admin__label">Discount type *</label>
                    <select className="admin__input" value={couponForm.discount_type} onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))}>
                      <option value="percent">Percent (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin__label">{couponForm.discount_type === 'percent' ? 'Discount %' : 'Discount ₹'} *</label>
                    <input className="admin__input" type="number" min="1" max={couponForm.discount_type === 'percent' ? 100 : undefined}
                      placeholder={couponForm.discount_type === 'percent' ? '10' : '100'} value={couponForm.discount_value}
                      onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))} />
                  </div>
                  <div>
                    <label className="admin__label">Max uses</label>
                    <input className="admin__input" type="number" min="1" placeholder="100" value={couponForm.max_uses}
                      onChange={e => setCouponForm(f => ({ ...f, max_uses: e.target.value }))} />
                  </div>
                  <div>
                    <label className="admin__label">Expires at (optional)</label>
                    <input className="admin__input" type="datetime-local" value={couponForm.expires_at}
                      onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} />
                  </div>
                  <div>
                    <label className="admin__label">Event ID (blank = all events)</label>
                    <input className="admin__input" placeholder="Leave blank for all events" value={couponForm.event_id}
                      onChange={e => setCouponForm(f => ({ ...f, event_id: e.target.value }))} />
                  </div>
                </div>
                {couponError && <div style={{ fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{couponError}</div>}
                {couponSaved  && <div style={{ fontSize: 12, color: 'var(--success)', marginBottom: 10 }}>Coupon created!</div>}
                <button className="admin__btn" type="submit" disabled={couponSaving}>{couponSaving ? 'Saving…' : 'Create coupon'}</button>
              </form>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Existing coupons</div>
            {couponsLoading ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
              : coupons.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No coupons yet.</div>
              : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {coupons.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--surface)', border: `1px solid ${c.active ? 'var(--border)' : 'var(--border-2)'}`, borderRadius: 8, padding: '12px 16px', opacity: c.active ? 1 : 0.55 }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em' }}>{c.code}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {c.discount_type === 'percent' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                        {' · '}{c.uses_count}/{c.max_uses} uses
                        {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString('en-IN')}`}
                        {c.event_id && ` · event: ${c.event_id}`}
                      </div>
                    </div>
                    <button onClick={() => toggleCoupon(c.id, c.active)} style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border-2)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer' }}>
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Influencers ───────────────────────────────────────────────────── */}
        {activeTab === 'influencers' && (
          <div className="admin__form-section" style={{ maxWidth: 640 }}>
            <h2>Influencer Free Passes</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Add an influencer's email here and they'll automatically get complimentary tickets at checkout. Passes expire after 1 year.
            </p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Add influencer</div>
              <form onSubmit={saveInfluencer} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="admin__label">Email *</label>
                    <input className="admin__input" type="email" placeholder="influencer@example.com" value={influencerForm.email}
                      onChange={e => setInfluencerForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="admin__label">Name (optional)</label>
                    <input className="admin__input" placeholder="Influencer name" value={influencerForm.name}
                      onChange={e => setInfluencerForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                </div>
                {influencerError && <div style={{ fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{influencerError}</div>}
                {influencerSaved  && <div style={{ fontSize: 12, color: 'var(--success)', marginBottom: 10 }}>Pass added! Expires in 1 year.</div>}
                <button className="admin__btn" type="submit" disabled={influencerSaving}>{influencerSaving ? 'Saving…' : 'Add pass'}</button>
              </form>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Active passes</div>
            {influencersLoading ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
              : influencers.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No influencer passes yet.</div>
              : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {influencers.map(inf => {
                  const expired = new Date(inf.expires_at) < new Date();
                  return (
                    <div key={inf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--surface)', border: `1px solid ${inf.active && !expired ? 'var(--border)' : 'var(--border-2)'}`, borderRadius: 8, padding: '12px 16px', opacity: inf.active && !expired ? 1 : 0.55 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{inf.name || inf.email}</div>
                        {inf.name && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inf.email}</div>}
                        <div style={{ fontSize: 11, color: expired ? 'var(--error)' : 'var(--text-muted)', marginTop: 3 }}>
                          {expired ? 'Expired' : `Expires ${new Date(inf.expires_at).toLocaleDateString('en-IN')}`}
                        </div>
                      </div>
                      <button onClick={() => toggleInfluencer(inf.id, inf.active)} style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border-2)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer' }}>
                        {inf.active ? 'Revoke' : 'Restore'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Stories ───────────────────────────────────────────────────────── */}
        {activeTab === 'stories' && (
          <div className="admin__form-section" style={{ maxWidth: 720 }}>
            <h2>Stories Moderation</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Review community stories before they go live. Approved stories appear on the public Stories page.
            </p>
            {!storiesLoading && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {['pending', 'approved', 'rejected'].map(s => {
                  const count = stories.filter(x => x.status === s).length;
                  const colors = { pending: 'var(--accent)', approved: 'var(--success)', rejected: 'var(--error)' };
                  return (
                    <div key={s} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: colors[s] }}>{count}</div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: 2 }}>{s}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {storiesLoading ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
              : stories.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No stories yet.</div>
              : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stories.map(s => (
                  <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', opacity: s.status === 'rejected' ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20,
                        background: s.status === 'approved' ? 'rgba(52,211,153,0.12)' : s.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                        color:      s.status === 'approved' ? 'var(--success)'          : s.status === 'rejected' ? 'var(--error)'           : 'var(--accent)',
                      }}>{s.status}</span>
                      {s.city && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.city}</span>}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(s.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)', marginBottom: 14, fontStyle: 'italic' }}>"{s.content}"</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {s.status !== 'approved' && <button onClick={() => moderateStory(s.id, 'approved')} style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--success)', background: 'rgba(52,211,153,0.08)', color: 'var(--success)', cursor: 'pointer' }}>Approve</button>}
                      {s.status !== 'rejected' && <button onClick={() => moderateStory(s.id, 'rejected')} style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border-2)', background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer' }}>Reject</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Scanner ───────────────────────────────────────────────────────── */}
        {activeTab === 'scanner' && (
          <div className="admin__form-section" style={{ maxWidth: 480 }}>
            <h2>Venue Door Scanner</h2>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!scannerActive && !scannedBooking && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                {scanError && <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>{scanError}</p>}
                <button className="btn btn-primary" onClick={startScanner}>📷 Start Camera</button>
              </div>
            )}
            {scannerActive && (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
                <video ref={videoRef} style={{ width: '100%', display: 'block' }} playsInline muted />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.4) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 160, height: 160, border: '2px solid rgba(255,255,255,0.8)', borderRadius: 12, boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)' }} />
                </div>
                <button onClick={stopScanner} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 20, color: '#fff', fontSize: 12, padding: '5px 12px', cursor: 'pointer' }}>Stop</button>
              </div>
            )}
            {scannedBooking && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 16px', marginBottom: 16 }}>
                {scanCheckedIn && <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: 'var(--success)', fontWeight: 700, fontSize: 14 }}>✅ Checked in</div>}
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{scannedBooking.event_title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{new Date(scannedBooking.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {scannedBooking.event_venue}</div>
                <div style={{ fontSize: 13, marginBottom: 2 }}><strong>Name:</strong> {scannedBooking.attendee?.name}</div>
                <div style={{ fontSize: 13, marginBottom: 2 }}><strong>Email:</strong> {scannedBooking.attendee?.email}</div>
                <div style={{ fontSize: 13, marginBottom: 2 }}><strong>Ref:</strong> {scannedBooking.id}</div>
                <div style={{ fontSize: 13, marginBottom: 16 }}><strong>Tickets:</strong> {(scannedBooking.tickets || []).map(t => `${t.type} ×${t.qty}`).join(', ')}</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {!scanCheckedIn && <button className="btn btn-primary" disabled={scanChecking} onClick={() => doCheckIn(scannedBooking.id)}>{scanChecking ? 'Checking in…' : '✅ Check In'}</button>}
                  <button className="btn btn-outline" onClick={() => { setScannedBooking(null); setScanError(''); setScanCheckedIn(false); startScanner(); }}>Scan Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Fundraisers ───────────────────────────────────────────────────── */}
        {activeTab === 'fundraisers' && (
          <div className="admin__form-section" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>All Fundraisers</h2>
              <button className="btn btn-ghost btn-sm" onClick={loadAllFundraisers}>↻ Refresh</button>
            </div>
            {fundraisersLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
            ) : allFundraisers.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 40 }}>
                <div className="empty-state__icon">💚</div>
                <h3>No fundraisers yet</h3>
                <p>Verified organizers create them from their Admin dashboard.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {allFundraisers.map(f => {
                  const pct = Math.min(100, Math.round((f.collected_amount / f.target_amount) * 100));
                  const daysLeft = f.end_date ? Math.max(0, Math.ceil((new Date(f.end_date) - Date.now()) / 86400000)) : null;
                  return (
                    <div key={f.id} style={{ background: 'var(--surface)', border: `1.5px solid ${f.status === 'active' ? 'rgba(16,185,129,.25)' : 'var(--border-2)'}`, borderRadius: 14, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{f.title}</p>
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                            by {f.organizer_name}
                            {f.end_date && <> · {daysLeft === 0 ? 'last day' : daysLeft !== null ? `${daysLeft}d left` : ''}</>}
                            {' · '}created {new Date(f.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, flexShrink: 0,
                          background: f.status === 'active' ? 'rgba(16,185,129,.12)' : f.status === 'closed' ? 'rgba(255,255,255,.06)' : 'rgba(139,92,246,.1)',
                          color:      f.status === 'active' ? '#10b981'              : f.status === 'closed' ? 'var(--text-muted)'       : 'var(--accent)',
                        }}>{f.status}</span>
                      </div>

                      <div style={{ height: 5, background: 'var(--border-2)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: 100, width: `${pct}%`, minWidth: 4 }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                          <strong style={{ color: '#10b981' }}>₹{f.collected_amount.toLocaleString('en-IN')}</strong>
                          {' '}of ₹{f.target_amount.toLocaleString('en-IN')} · {pct}% · {f.donor_count} {f.donor_count === 1 ? 'donor' : 'donors'}
                        </p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {f.status !== 'active' && (
                            <button disabled={frActing === f.id} onClick={() => setFundraiserStatus(f.id, 'active')}
                              style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #10b981', background: 'rgba(16,185,129,.08)', color: '#10b981', cursor: 'pointer' }}>
                              Set Active
                            </button>
                          )}
                          {f.status !== 'closed' && (
                            <button disabled={frActing === f.id} onClick={() => setFundraiserStatus(f.id, 'closed')}
                              style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-2)', background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                              Close
                            </button>
                          )}
                          {f.status !== 'draft' && (
                            <button disabled={frActing === f.id} onClick={() => setFundraiserStatus(f.id, 'draft')}
                              style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(139,92,246,.3)', background: 'rgba(139,92,246,.06)', color: 'var(--accent)', cursor: 'pointer' }}>
                              Draft
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

        {/* ── Add Event ─────────────────────────────────────────────────────── */}
        {activeTab === 'add' && (
          <form className="admin__form" onSubmit={handleSubmit} noValidate>
            {submitted && <div className="admin__success">✅ Event submitted successfully! It's now live on Q2Q.</div>}
            {formErrors._form && <div className="admin__error" style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>{formErrors._form}</div>}
            <div className="admin__form-section">
              <h2>Event Details</h2>
              <div className="form-group"><label>Event Title *</label><input type="text" placeholder="e.g. Bangalore Pride Parade 2026" value={form.title} onChange={e => setField('title', e.target.value)} />{formErrors.title && <span className="admin__error">{formErrors.title}</span>}</div>
              <div className="form-row form-row-2">
                <div className="form-group"><label>City *</label><select value={form.city} onChange={e => setField('city', e.target.value)}>{CITIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label>Category *</label><select value={form.category} onChange={e => setField('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="form-group"><label>Venue Name *</label><input type="text" placeholder="e.g. Cubbon Park Amphitheatre" value={form.venue} onChange={e => setField('venue', e.target.value)} />{formErrors.venue && <span className="admin__error">{formErrors.venue}</span>}</div>
              <div className="form-group"><label>Full Address</label><input type="text" placeholder="Street, Area, City, PIN" value={form.address} onChange={e => setField('address', e.target.value)} /></div>
              <div className="form-row form-row-2">
                <div className="form-group"><label>Date *</label><input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />{formErrors.date && <span className="admin__error">{formErrors.date}</span>}</div>
                <div className="form-group"><label>Start Time *</label><input type="time" value={form.time} onChange={e => setField('time', e.target.value)} />{formErrors.time && <span className="admin__error">{formErrors.time}</span>}</div>
              </div>
              <div className="form-group"><label>End Time</label><input type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} /></div>
              <div className="form-group"><label>Description *</label><textarea rows={4} placeholder="Tell people what to expect…" value={form.description} onChange={e => setField('description', e.target.value)} />{formErrors.description && <span className="admin__error">{formErrors.description}</span>}</div>
              <div className="form-group"><label>Card Colour Theme</label><div className="admin__gradients">{GRADIENTS.map(g => <button key={g.value} type="button" className={`admin__gradient-swatch ${form.gradient === g.value ? 'admin__gradient-swatch--selected' : ''}`} style={{ background: g.value }} title={g.label} onClick={() => setField('gradient', g.value)} />)}</div></div>
            </div>
            <div className="admin__form-section">
              <h2>Organizer Info</h2>
              <div className="form-row form-row-2">
                <div className="form-group"><label>Organizer Name *</label><input type="text" placeholder="Org or collective name" value={form.organizer} onChange={e => setField('organizer', e.target.value)} />{formErrors.organizer && <span className="admin__error">{formErrors.organizer}</span>}</div>
                <div className="form-group"><label>Contact Email</label><input type="email" placeholder="contact@yourorg.in" value={form.organizerContact} onChange={e => setField('organizerContact', e.target.value)} /></div>
              </div>
            </div>
            <div className="admin__form-section">
              <div className="admin__tickets-header"><h2>Ticket Types</h2><button type="button" className="btn btn-ghost btn-sm" onClick={addTicketRow}>+ Add Type</button></div>
              {form.tickets.map((ticket, i) => (
                <div key={i} className="admin__ticket-row">
                  <div className="admin__ticket-row-header"><span className="admin__ticket-num">Ticket {i + 1}</span>{form.tickets.length > 1 && <button type="button" className="admin__ticket-remove" onClick={() => removeTicketRow(i)}>✕</button>}</div>
                  <div className="form-row admin__ticket-fields">
                    <div className="form-group"><label>Type Name *</label><input type="text" placeholder="General / VIP / Free" value={ticket.type} onChange={e => setTicket(i, 'type', e.target.value)} />{formErrors[`ticket_type_${i}`] && <span className="admin__error">{formErrors[`ticket_type_${i}`]}</span>}</div>
                    <div className="form-group"><label>Price (₹) * (0 for free)</label><input type="number" min="0" placeholder="499" value={ticket.price} onChange={e => setTicket(i, 'price', e.target.value)} />{formErrors[`ticket_price_${i}`] && <span className="admin__error">{formErrors[`ticket_price_${i}`]}</span>}</div>
                    <div className="form-group"><label>Available Spots</label><input type="number" min="1" placeholder="100" value={ticket.available} onChange={e => setTicket(i, 'available', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label>Description</label><input type="text" placeholder="What's included" value={ticket.description} onChange={e => setTicket(i, 'description', e.target.value)} /></div>
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
