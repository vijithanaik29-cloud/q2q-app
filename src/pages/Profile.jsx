import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CommunityAuth from '../components/CommunityAuth';
import './Profile.css';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Other'];

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useApp();

  const [editing,     setEditing]     = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [city,        setCity]        = useState('');
  const [bio,         setBio]         = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [authModal,   setAuthModal]   = useState(false);

  if (!user) {
    return (
      <div className="profile fade-up">
        {authModal && (
          <CommunityAuth
            onClose={() => setAuthModal(false)}
            onSuccess={() => setAuthModal(false)}
          />
        )}
        <div className="container profile__gate">
          <div className="profile__gate-icon">🏳️‍🌈</div>
          <h1>Your community profile</h1>
          <p>Join Q2Q to connect with the queer community, like and comment on stories, and optionally become a mentor.</p>
          <button className="btn btn-rainbow" onClick={() => setAuthModal(true)}>
            Join the community
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile fade-up">
        {authModal && (
          <CommunityAuth
            onClose={() => setAuthModal(false)}
            onSuccess={() => setAuthModal(false)}
          />
        )}
        <div className="container profile__gate">
          <div className="profile__gate-icon">👤</div>
          <h1>Set up your profile</h1>
          <p>Choose a display name to start participating in the community.</p>
          <button className="btn btn-rainbow" onClick={() => setAuthModal(true)}>
            Set up profile
          </button>
        </div>
      </div>
    );
  }

  function startEdit() {
    setDisplayName(profile.display_name);
    setCity(profile.city || '');
    setBio(profile.bio || '');
    setError('');
    setSuccess(false);
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name cannot be empty.'); return; }
    setError('');
    setSaving(true);
    const { error: err } = await updateProfile({
      display_name: displayName.trim(),
      city:         city || null,
      bio:          bio.trim() || null,
    });
    setSaving(false);
    if (err) { setError('Could not save changes. Please try again.'); return; }
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const initials = profile.display_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile fade-up">
      <div className="container">
        <div className="profile__card">

          {/* Avatar + name */}
          <div className="profile__header">
            <div className="profile__avatar">{initials}</div>
            <div className="profile__header-info">
              <h1 className="profile__name">{profile.display_name}</h1>
              <div className="profile__meta">
                {profile.city && <span className="profile__city">📍 {profile.city}</span>}
              </div>
            </div>
          </div>

          {profile.bio && <p className="profile__bio">{profile.bio}</p>}

          {success && (
            <div className="profile__success">Profile updated ✓</div>
          )}

          {/* Edit form */}
          {editing ? (
            <form className="profile__form" onSubmit={handleSave} noValidate>
              <div className="profile__field">
                <label className="profile__label">Display name</label>
                <input
                  className="profile__input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={40}
                  placeholder="Your chosen name"
                  autoFocus
                />
                <p className="profile__hint">Your alias — real name is never shown to anyone.</p>
              </div>

              <div className="profile__field">
                <label className="profile__label">City <span className="profile__optional">(optional)</span></label>
                <select className="profile__select" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">Not specified</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="profile__field">
                <label className="profile__label">Bio <span className="profile__optional">(optional)</span></label>
                <textarea
                  className="profile__textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="A few words about yourself…"
                  rows={3}
                />
                <p className="profile__hint" style={{ textAlign: 'right' }}>{bio.length}/200</p>
              </div>

              {error && <p className="profile__error">{error}</p>}

              <div className="profile__form-actions">
                <button className="btn btn-rainbow" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="profile__cancel" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile__actions">
              <button className="profile__edit-btn" onClick={startEdit}>Edit profile</button>
              <button className="profile__signout-btn" onClick={signOut}>Sign out</button>
            </div>
          )}

          {/* Links */}
          <div className="profile__links">
            <Link to="/stories" className="profile__link">📖 Coming out stories</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
