import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Fundraisers.css';

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

function ProgressBar({ collected, target }) {
  const pct = Math.min(100, Math.round((collected / target) * 100));
  return (
    <div className="fr-progress">
      <div className="fr-progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

function FundraiserCard({ f, onClick }) {
  const pct     = Math.min(100, Math.round((f.collected_amount / f.target_amount) * 100));
  const daysLeft = f.end_date
    ? Math.max(0, Math.ceil((new Date(f.end_date) - Date.now()) / 86400000))
    : null;

  return (
    <div className="fr-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="fr-card__body">
        <h3 className="fr-card__title">{f.title}</h3>
        <p className="fr-card__cause">{f.cause.slice(0, 160)}{f.cause.length > 160 ? '…' : ''}</p>
      </div>
      <div className="fr-card__footer">
        <ProgressBar collected={f.collected_amount} target={f.target_amount} />
        <div className="fr-card__stats">
          <div>
            <span className="fr-card__raised">₹{f.collected_amount.toLocaleString('en-IN')}</span>
            <span className="fr-card__of"> raised of ₹{f.target_amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="fr-card__meta">
            <span>{pct}% funded</span>
            {daysLeft !== null && <span>·</span>}
            {daysLeft !== null && <span>{daysLeft === 0 ? 'Last day' : `${daysLeft}d left`}</span>}
          </div>
        </div>
        <div className="fr-card__donor-row">
          <span className="fr-card__donors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {f.donor_count} {f.donor_count === 1 ? 'donor' : 'donors'}
          </span>
          <span className="fr-card__org">by {f.organizer_name}</span>
        </div>
      </div>
    </div>
  );
}

function DonateModal({ fundraiser, onClose, onSuccess }) {
  const [amount,    setAmount]    = useState(500);
  const [custom,    setCustom]    = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [message,   setMessage]   = useState('');
  const [anon,      setAnon]      = useState(false);
  const [paying,    setPaying]    = useState(false);
  const [error,     setError]     = useState('');

  const finalAmount = useCustom ? parseInt(custom || '0', 10) : amount;

  async function handleDonate() {
    setError('');
    if (!name.trim())  { setError('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email.'); return; }
    if (!finalAmount || finalAmount < 1) { setError('Enter a valid amount.'); return; }

    setPaying(true);
    try {
      const { data: orderData, error: orderErr } = await supabase.functions.invoke('create-donation-order', {
        body: { amount: finalAmount, fundraiserId: fundraiser.id, fundraiserTitle: fundraiser.title },
      });
      if (orderErr) throw new Error(orderErr.message);

      const { data: { key: razorpayKey } = {} } = await supabase
        .from('app_config').select('key').eq('name', 'razorpay_key_id').single();

      const options = {
        key:          orderData.keyId,
        amount:       finalAmount * 100,
        currency:     'INR',
        name:         'Q2Q — Queer Events India',
        description:  fundraiser.title,
        order_id:     orderData.orderId,
        prefill:      { name, email },
        theme:        { color: '#10b981' },
        handler: async (response) => {
          const { data, error: confirmErr } = await supabase.functions.invoke('confirm-donation', {
            body: {
              payment:  response,
              donation: {
                fundraiserId:    fundraiser.id,
                fundraiserTitle: fundraiser.title,
                amount:          finalAmount,
                donor:           { name, email },
                message:         message.trim() || null,
                anonymous:       anon,
              },
            },
          });
          if (confirmErr) throw new Error(confirmErr.message);
          onSuccess(finalAmount, data.donationId);
        },
        modal: { ondismiss: () => setPaying(false) },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setPaying(false);
    }
  }

  return (
    <div className="fr-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fr-modal">
        <button className="fr-modal__close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="fr-modal__title">Donate to</h2>
        <p className="fr-modal__campaign">{fundraiser.title}</p>

        <div className="fr-modal__presets">
          {PRESET_AMOUNTS.map(a => (
            <button key={a}
              className={`fr-preset${!useCustom && amount === a ? ' fr-preset--active' : ''}`}
              onClick={() => { setAmount(a); setUseCustom(false); }}
            >₹{a.toLocaleString('en-IN')}</button>
          ))}
          <button
            className={`fr-preset${useCustom ? ' fr-preset--active' : ''}`}
            onClick={() => setUseCustom(true)}
          >Custom</button>
        </div>

        {useCustom && (
          <input
            className="fr-modal__input"
            type="number"
            placeholder="Enter amount (₹)"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            min="1"
            autoFocus
          />
        )}

        <input className="fr-modal__input" type="text"     placeholder="Your name *"  value={name}  onChange={e => setName(e.target.value)} />
        <input className="fr-modal__input" type="email"    placeholder="Your email *" value={email} onChange={e => setEmail(e.target.value)} />
        <textarea className="fr-modal__input fr-modal__textarea" placeholder="Leave a message (optional)" value={message} onChange={e => setMessage(e.target.value)} rows={2} />

        <label className="fr-modal__anon">
          <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} />
          <span>Donate anonymously (your name won't be shown publicly)</span>
        </label>

        {error && <p className="fr-modal__error">{error}</p>}

        <button className="btn btn-primary fr-modal__cta" onClick={handleDonate} disabled={paying || !finalAmount}>
          {paying ? 'Opening payment…' : `Donate ₹${(finalAmount || 0).toLocaleString('en-IN')}`}
        </button>
      </div>
    </div>
  );
}

function FundraiserDetail({ id }) {
  const navigate     = useNavigate();
  const [f, setF]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonate, setShowDonate] = useState(false);
  const [donated, setDonated] = useState(null);

  useEffect(() => {
    supabase.from('fundraisers').select('*').eq('id', id).eq('status', 'active').single()
      .then(({ data }) => { setF(data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="fr-loading">Loading…</div>;
  if (!f) return (
    <div className="fr-not-found container">
      <h2>Campaign not found</h2>
      <Link to="/fundraisers" className="btn btn-outline">← All campaigns</Link>
    </div>
  );

  const pct      = Math.min(100, Math.round((f.collected_amount / f.target_amount) * 100));
  const daysLeft = f.end_date
    ? Math.max(0, Math.ceil((new Date(f.end_date) - Date.now()) / 86400000))
    : null;

  return (
    <div className="fr-detail fade-up">
      <div className="fr-detail__hero">
        <div className="container">
          <Link to="/fundraisers" className="fr-detail__back">← All campaigns</Link>
          <h1 className="fr-detail__title">{f.title}</h1>
          <p className="fr-detail__by">by {f.organizer_name}</p>
        </div>
      </div>

      <div className="container fr-detail__body">
        <div className="fr-detail__left">
          <div className="fr-detail__cause-card card">
            <h3>About this campaign</h3>
            <p className="fr-detail__cause-text">{f.cause}</p>
          </div>
        </div>

        <div className="fr-detail__right">
          <div className="fr-detail__stats card">
            <div className="fr-detail__amount">₹{f.collected_amount.toLocaleString('en-IN')}</div>
            <p className="fr-detail__of">raised of <strong>₹{f.target_amount.toLocaleString('en-IN')}</strong> goal</p>
            <ProgressBar collected={f.collected_amount} target={f.target_amount} />
            <div className="fr-detail__stat-row">
              <div className="fr-detail__stat">
                <span className="fr-detail__stat-num">{pct}%</span>
                <span className="fr-detail__stat-label">funded</span>
              </div>
              <div className="fr-detail__stat">
                <span className="fr-detail__stat-num">{f.donor_count}</span>
                <span className="fr-detail__stat-label">donors</span>
              </div>
              {daysLeft !== null && (
                <div className="fr-detail__stat">
                  <span className="fr-detail__stat-num">{daysLeft}</span>
                  <span className="fr-detail__stat-label">days left</span>
                </div>
              )}
            </div>

            {donated ? (
              <div className="fr-detail__thanks">
                <div className="fr-detail__thanks-icon">💚</div>
                <strong>Thank you for donating ₹{donated.amount.toLocaleString('en-IN')}!</strong>
                <p>Donation ID: <code>{donated.id}</code></p>
                <p>A receipt has been sent to your email.</p>
              </div>
            ) : (
              <button className="btn btn-primary fr-detail__donate-btn" onClick={() => setShowDonate(true)}>
                Donate Now
              </button>
            )}
          </div>
        </div>
      </div>

      {showDonate && (
        <DonateModal
          fundraiser={f}
          onClose={() => setShowDonate(false)}
          onSuccess={(amount, donationId) => {
            setShowDonate(false);
            setDonated({ amount, id: donationId });
            setF(prev => ({
              ...prev,
              collected_amount: prev.collected_amount + amount,
              donor_count: prev.donor_count + 1,
            }));
          }}
        />
      )}
    </div>
  );
}

export default function Fundraisers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      supabase.from('fundraisers').select('*').eq('status', 'active')
        .order('created_at', { ascending: false })
        .then(({ data }) => { setFundraisers(data || []); setLoading(false); });
    }
  }, [id]);

  if (id) return <FundraiserDetail id={id} />;

  return (
    <div className="fundraisers fade-up">
      <div className="fr-banner">
        <div className="container fr-banner__inner">
          <div className="fr-banner__eyebrow">Fundraisers</div>
          <h1 className="fr-banner__title">Support queer causes.</h1>
          <p className="fr-banner__sub">
            Every rupee goes directly to the campaign. Support queer-led causes across India.
          </p>
        </div>
      </div>

      <div className="container fr-list-wrap">
        {loading ? (
          <div className="fr-loading">Loading campaigns…</div>
        ) : fundraisers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">💚</div>
            <h3>No active campaigns yet</h3>
            <p>Check back soon — campaigns from verified organisers will appear here.</p>
          </div>
        ) : (
          <div className="fr-grid">
            {fundraisers.map(f => (
              <FundraiserCard key={f.id} f={f} onClick={() => navigate(`/fundraisers/${f.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
