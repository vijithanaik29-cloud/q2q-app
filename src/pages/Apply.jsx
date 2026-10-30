import { useState } from 'react';
import { Link } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import './Apply.css';

const FOOD_DRINKS_OPTIONS = [
  'Included in ticket', 'Available for purchase', 'Not available',
];

const SEATING_OPTIONS = ['Seated', 'Standing', 'Mixed'];

const AGE_OPTIONS = ['All ages', '18+', '21+'];

const EVENT_TYPES = [
  'Pride & Marches', 'Club Nights & Parties', 'Film & Cinema',
  'Workshops & Talks', 'Support Circles', 'Art & Exhibitions',
  'Sports & Fitness', 'Speed Dating & Mixers', 'Drag Shows', 'Other',
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Goa', 'Ahmedabad', 'Jaipur', 'Other',
];

export default function Apply() {
  const [form, setForm] = useState({
    name: '', org_name: '', email: '', phone: '',
    city: '', event_types: [], instagram: '', facebook: '', website: '', message: '',
    food_drinks: '', seating_type: '', age_restriction: '', dress_code: '', accessibility: '',
  });
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function toggleType(type) {
    setForm(p => ({
      ...p,
      event_types: p.event_types.includes(type)
        ? p.event_types.filter(t => t !== type)
        : [...p.event_types, type],
    }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())     errs.name     = 'Required';
    if (!form.org_name.trim()) errs.org_name = 'Required';
    if (!form.email.trim())    errs.email    = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim())    errs.phone    = 'Required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid Indian mobile number';
    if (!form.city)            errs.city     = 'Required';
    if (!form.event_types.length) errs.event_types = 'Select at least one';
    if (!form.instagram.trim())
      errs.instagram = 'Instagram profile is required';
    if (!form.website.trim())
      errs.website = 'Website or Google Maps link is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const { error } = await supabase.from('organizer_applications').insert({
        name:        form.name.trim(),
        org_name:    form.org_name.trim(),
        email:       form.email.trim().toLowerCase(),
        phone:       form.phone.trim(),
        city:        form.city,
        event_types: form.event_types,
        instagram:       form.instagram.trim() || null,
        facebook:        form.facebook.trim() || null,
        website:         form.website.trim() || null,
        message:         form.message.trim(),
        food_drinks:     form.food_drinks || null,
        seating_type:    form.seating_type || null,
        age_restriction: form.age_restriction || null,
        dress_code:      form.dress_code.trim() || null,
        accessibility:   form.accessibility.trim() || null,
      });
      if (error) {
        if (error.code === '23505') {
          setErrors({ email: 'This email has already applied.' });
        } else {
          throw error;
        }
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="apply-success fade-up">
        <div className="container">
          <div className="apply-success__card">
            <div className="apply-success__icon">🌈</div>
            <h1>Application received!</h1>
            <p>
              Thank you for applying to list events on Q2Q. We're reviewing your application
              and will get back to you within 2–3 business days.
            </p>
            <p className="apply-success__sub">
              We'll reach out to <strong>{form.email}</strong> once your account is ready.
            </p>
            <Link to="/" className="btn btn-primary">Back to Q2Q</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply fade-up">
      <div className="container">
        <div className="apply__header">
          <h1>List your events on Q2Q</h1>
          <p>
            Q2Q is India's queer events platform. Apply to become an organizer and
            reach thousands of queer people across India.
          </p>
        </div>

        {/* How Q2Q works */}
        <div className="apply__model">
          <div className="apply__model-step">
            <span className="apply__model-icon">🏳️‍🌈</span>
            <div>
              <div className="apply__model-label">Free to list</div>
              <div className="apply__model-desc">No upfront cost. Get approved and list your events on Q2Q for free.</div>
            </div>
          </div>
          <div className="apply__model-divider">→</div>
          <div className="apply__model-step">
            <span className="apply__model-icon">🎟️</span>
            <div>
              <div className="apply__model-label">We take 10%</div>
              <div className="apply__model-desc">On every paid ticket sold through Q2Q. Your payout lands <strong>30 min after your event ends</strong>. Free events always ₹0.</div>
            </div>
          </div>
          <div className="apply__model-divider">→</div>
          <div className="apply__model-step">
            <span className="apply__model-icon">⚡</span>
            <div>
              <div className="apply__model-label">Optional boost</div>
              <div className="apply__model-desc">Pay once to put your event at the top of listings until event day.</div>
            </div>
          </div>
        </div>

        {/* Sponsored boost card */}
        <div className="apply__boost-card">
          <div className="apply__boost-header">
            <span className="apply__boost-badge">⚡ Sponsored Placement</span>
            <h3 className="apply__boost-title">Get to the top of listings</h3>
            <p className="apply__boost-sub">
              One payment per event. Your event jumps to the top of Q2Q listings the moment you boost,
              and stays there until your event day. Then it's done. No subscription, no recurring charge.
            </p>
          </div>
          <div className="apply__boost-plans">
            <div className="apply__boost-plan">
              <div className="apply__boost-plan-name">Event Boost</div>
              <div className="apply__boost-plan-price">₹999 <span>/event</span></div>
              <div className="apply__boost-plan-who">For cafés, restaurants &amp; small promoters</div>
              <ul className="apply__boost-plan-features">
                <li>Top of your city listings until event day</li>
                <li>⚡ Sponsored badge on your event card</li>
                <li>Break-even at ~2 extra ticket sales</li>
              </ul>
            </div>
            <div className="apply__boost-plan apply__boost-plan--highlight">
              <div className="apply__boost-plan-tag">Best for large events</div>
              <div className="apply__boost-plan-name">Event Spotlight</div>
              <div className="apply__boost-plan-price">₹2,499 <span>/event</span></div>
              <div className="apply__boost-plan-who">For clubs, festivals &amp; big ticketed events</div>
              <ul className="apply__boost-plan-features">
                <li>Top of all cities + category listings</li>
                <li>⚡ Sponsored badge on your event card</li>
                <li>Featured on the Q2Q homepage</li>
                <li>Break-even at ~5 extra ticket sales</li>
              </ul>
            </div>
          </div>
          <p className="apply__boost-note">
            Available in your organiser portal once approved. One click, no tech skills needed.
          </p>
        </div>

        <form className="apply__form card" onSubmit={handleSubmit} noValidate>

          <div className="apply__section-title">About you</div>

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="name">Your name *</label>
              <input id="name" type="text" placeholder="Your full name"
                value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <span className="apply__error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="org_name">Organisation / Promoter name *</label>
              <input id="org_name" type="text" placeholder="Your organisation or promoter name"
                value={form.org_name} onChange={e => set('org_name', e.target.value)} />
              {errors.org_name && <span className="apply__error">{errors.org_name}</span>}
            </div>
          </div>

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input id="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <span className="apply__error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Mobile number *</label>
              <input id="phone" type="tel" placeholder="10-digit mobile number"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
              {errors.phone && <span className="apply__error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="city">Primary city *</label>
            <select id="city" value={form.city} onChange={e => set('city', e.target.value)}>
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.city && <span className="apply__error">{errors.city}</span>}
          </div>

          <div className="apply__section-title" style={{ marginTop: 8 }}>Your events</div>

          <div className="form-group">
            <label>Types of events you organise *</label>
            <div className="apply__tags">
              {EVENT_TYPES.map(type => (
                <button
                  key={type} type="button"
                  className={`apply__tag ${form.event_types.includes(type) ? 'apply__tag--active' : ''}`}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.event_types && <span className="apply__error">{errors.event_types}</span>}
          </div>

          <div className="apply__section-title" style={{ marginTop: 8 }}>Event format</div>
          <p className="apply__section-sub">Help us understand how your events typically run. All optional.</p>

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="food_drinks">Food &amp; drinks</label>
              <select id="food_drinks" value={form.food_drinks} onChange={e => set('food_drinks', e.target.value)}>
                <option value="">Select…</option>
                {FOOD_DRINKS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="seating_type">Seating</label>
              <select id="seating_type" value={form.seating_type} onChange={e => set('seating_type', e.target.value)}>
                <option value="">Select…</option>
                {SEATING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="age_restriction">Age restriction</label>
              <select id="age_restriction" value={form.age_restriction} onChange={e => set('age_restriction', e.target.value)}>
                <option value="">Select…</option>
                {AGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="dress_code">Dress code</label>
              <input id="dress_code" type="text" placeholder="e.g. Smart casual, No dress code"
                value={form.dress_code} onChange={e => set('dress_code', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="accessibility">Accessibility</label>
            <input id="accessibility" type="text"
              placeholder="e.g. Wheelchair accessible, step-free entry, gender-neutral toilets"
              value={form.accessibility} onChange={e => set('accessibility', e.target.value)} />
          </div>

          <div className="apply__section-title" style={{ marginTop: 8 }}>Verify your identity</div>
          <p className="apply__section-sub">We verify every organiser before approving. Your Instagram profile and website help us confirm you're a real event organiser or business.</p>

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="instagram">Instagram profile *</label>
              <input id="instagram" type="url" placeholder="https://instagram.com/yourhandle"
                value={form.instagram} onChange={e => set('instagram', e.target.value)} />
              {errors.instagram && <span className="apply__error">{errors.instagram}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="facebook">Facebook page <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input id="facebook" type="url" placeholder="https://facebook.com/yourpage"
                value={form.facebook} onChange={e => set('facebook', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="website">Website or Google Maps link *</label>
            <input id="website" type="url" placeholder="https://yourwebsite.com or maps.google.com/..."
              value={form.website} onChange={e => set('website', e.target.value)} />
            {errors.website && <span className="apply__error">{errors.website}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="message">Tell us about your work (optional)</label>
            <textarea id="message" rows={4}
              placeholder="What kind of events do you run? Who is your community?"
              value={form.message} onChange={e => set('message', e.target.value)} />
          </div>

          {errors.submit && (
            <p style={{ color: 'var(--error)', fontSize: 13 }}>{errors.submit}</p>
          )}

          <label className="apply__consent">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
            />
            <span>
              I have read and agree to Q2Q's <Link to="/terms" target="_blank">Terms of Service</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>. I confirm that I am solely responsible for the safety, security, and welfare of attendees at any events I list on Q2Q.
            </span>
          </label>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !termsAccepted}>
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>

          <p className="apply__footer">
            Already a verified organiser? <Link to="/admin">Sign in to your portal</Link>
          </p>
        </form>

        {/* Sponsor section */}
        <div className="apply__sponsor-section">
          <div className="apply__sponsor-header">
            <span className="apply__sponsor-badge">Advertise</span>
            <h2 className="apply__sponsor-title">Reach India's queer community</h2>
            <p className="apply__sponsor-sub">
              Q2Q is visited by LGBTQ+ people across India looking for events, community, and spaces where they belong. If your business welcomes them, put it in front of them.
            </p>
          </div>

          <div className="apply__sponsor-tiers">
            <div className="apply__sponsor-tier">
              <div className="apply__sponsor-tier-name">Community Partner</div>
              <div className="apply__sponsor-tier-price">₹999<span>/month</span></div>
              <ul className="apply__sponsor-tier-list">
                <li>Banner strip on the Q2Q homepage</li>
                <li>Your name + tagline + link</li>
                <li>Shown to all visitors in your city</li>
                <li>Cancel anytime</li>
              </ul>
              <a href="/admin" className="apply__sponsor-cta">Advertise as organiser →</a>
            </div>

            <div className="apply__sponsor-tier apply__sponsor-tier--featured">
              <div className="apply__sponsor-tier-badge">Most popular</div>
              <div className="apply__sponsor-tier-name">Pride Sponsor</div>
              <div className="apply__sponsor-tier-price">₹2,499<span>/month</span></div>
              <ul className="apply__sponsor-tier-list">
                <li>Homepage banner across all cities</li>
                <li>Logo on every event page</li>
                <li>Named sponsor in our social posts</li>
                <li>Cancel anytime</li>
              </ul>
              <a href="/admin" className="apply__sponsor-cta apply__sponsor-cta--primary">Advertise as organiser →</a>
            </div>
          </div>

          <p className="apply__sponsor-note">
            Already a verified organiser? Log into your portal and go to the <strong>Advertise</strong> tab to submit your banner for review.
          </p>
        </div>
      </div>
    </div>
  );
}
