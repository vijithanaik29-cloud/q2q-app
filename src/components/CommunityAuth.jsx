import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './CommunityAuth.css';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Other'];

const ADJECTIVES = [
  'Fabulous','Glittery','Sparkling','Dramatic','Iconic','Sassy','Dazzling',
  'Radiant','Majestic','Fierce','Legendary','Desi','Spicy','Chaotic','Magical',
  'Proud','Caffeinated','Nervous','Screaming','Mythical','Electric','Velvet',
];
const NOUNS = [
  'Peacock','Flamingo','Disco Ball','Samosa','Chai Cup','Unicorn','Rainbow',
  'Butterfly','Lotus','Mango','Gulab Jamun','Sequin','Bangles','Supernova',
  'Coconut','Paneer','Marigold','Kite','Firework','Moon','Comet','Sapphire',
];

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a} ${n}`;
}

export default function CommunityAuth({ onClose, onSuccess, initialStep = 'auth' }) {
  const { signInWithGoogle, createProfile } = useApp();

  const [step,        setStep]        = useState(initialStep);
  const [displayName, setDisplayName] = useState(randomName);
  const [city,        setCity]        = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  async function handleGoogle() {
    setError('');
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err.message); setLoading(false); }
    // On success, the page redirects to Google — no further action needed here
  }

  async function handleOnboard(e) {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please choose a display name.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await createProfile({ displayName: displayName.trim(), city });
    setLoading(false);
    if (err) { setError('Could not save profile. Please try again.'); return; }
    onSuccess?.();
    onClose?.();
  }

  if (step === 'onboard') {
    return (
      <div className="cauth__backdrop" onClick={step === 'auth' ? onClose : undefined}>
        <div className="cauth__modal" onClick={e => e.stopPropagation()}>
          {onClose && step === 'auth' && (
            <button className="cauth__close" onClick={onClose} aria-label="Close">×</button>
          )}
          <div className="cauth__rainbow-stripe" />
          <div className="cauth__body">
            <div className="cauth__icon">🌈</div>
            <h2 className="cauth__title">You're in!</h2>
            <p className="cauth__sub">Choose how you appear to the community. You can always change this later.</p>
            <form onSubmit={handleOnboard} noValidate>
              <label className="cauth__label">Your name in the community</label>
              <div className="cauth__name-row">
                <input
                  className="cauth__input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={40}
                  placeholder="e.g. Fabulous Flamingo"
                  autoFocus
                />
                <button
                  type="button"
                  className="cauth__shuffle"
                  onClick={() => setDisplayName(randomName())}
                  title="Suggest a fun name"
                >🎲</button>
              </div>
              <p className="cauth__hint">This is your alias — your real name is never shown.</p>

              <label className="cauth__label" style={{ marginTop: 16 }}>City <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
              <select className="cauth__select" value={city} onChange={e => setCity(e.target.value)}>
                <option value="">Select city…</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {error && <p className="cauth__error">{error}</p>}
              <button className="cauth__btn" type="submit" disabled={loading || !displayName.trim()}>
                {loading ? 'Saving…' : 'Join the community →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cauth__backdrop" onClick={onClose}>
      <div className="cauth__modal" onClick={e => e.stopPropagation()}>
        <button className="cauth__close" onClick={onClose} aria-label="Close">×</button>
        <div className="cauth__rainbow-stripe" />
        <div className="cauth__body">
          <div className="cauth__icon">🏳️‍🌈</div>
          <h2 className="cauth__title">Join the community</h2>
          <p className="cauth__sub">No real name. No phone number. Just you and your people.</p>

          {error && <p className="cauth__error">{error}</p>}

          <button
            className="cauth__google-btn"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <p className="cauth__privacy">We don't store your real name, phone number, or location.</p>
        </div>
      </div>
    </div>
  );
}
