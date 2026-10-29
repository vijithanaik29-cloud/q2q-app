import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Apply.css';

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
    city: '', event_types: [], instagram: '', website: '', message: '',
  });
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

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
        instagram:   form.instagram.trim(),
        website:     form.website.trim(),
        message:     form.message.trim(),
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

        {/* Sponsored boost info card */}
        <div className="apply__boost-card">
          <div className="apply__boost-header">
            <span className="apply__boost-badge">⚡ New</span>
            <h3 className="apply__boost-title">Get more eyes on your event</h3>
            <p className="apply__boost-sub">
              Q2Q Sponsored Placement puts your event at the top of city and category listings —
              with a gold badge that stands out. More visibility = more ticket sales.
            </p>
          </div>
          <div className="apply__boost-plans">
            <div className="apply__boost-plan">
              <div className="apply__boost-plan-name">Weekly Spotlight</div>
              <div className="apply__boost-plan-price">₹999 <span>/event</span></div>
              <ul className="apply__boost-plan-features">
                <li>Top of city &amp; category listings for 7 days</li>
                <li>⚡ Sponsored badge on your event card</li>
                <li>Increased click-through from browsing users</li>
              </ul>
            </div>
            <div className="apply__boost-plan apply__boost-plan--highlight">
              <div className="apply__boost-plan-tag">Most popular</div>
              <div className="apply__boost-plan-name">Monthly Top Placement</div>
              <div className="apply__boost-plan-price">₹2,499 <span>/event</span></div>
              <ul className="apply__boost-plan-features">
                <li>Top of all India + city listings for 30 days</li>
                <li>⚡ Sponsored badge on your event card</li>
                <li>Priority placement on the homepage</li>
                <li>Best for ticketed events &amp; large gatherings</li>
              </ul>
            </div>
          </div>
          <p className="apply__boost-note">
            You can add sponsored placement after your organizer account is approved.
            We'll guide you through it — no tech needed.
          </p>
        </div>

        <form className="apply__form card" onSubmit={handleSubmit} noValidate>

          <div className="apply__section-title">About you</div>

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="name">Your name *</label>
              <input id="name" type="text" placeholder="Priya Sharma"
                value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <span className="apply__error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="org_name">Organisation / Promoter name *</label>
              <input id="org_name" type="text" placeholder="Rainbow Collective"
                value={form.org_name} onChange={e => set('org_name', e.target.value)} />
              {errors.org_name && <span className="apply__error">{errors.org_name}</span>}
            </div>
          </div>

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input id="email" type="email" placeholder="priya@rainbow.org"
                value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <span className="apply__error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Mobile number *</label>
              <input id="phone" type="tel" placeholder="9876543210"
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

          <div className="apply__row">
            <div className="form-group">
              <label htmlFor="instagram">Instagram handle</label>
              <input id="instagram" type="text" placeholder="@rainbowcollective"
                value={form.instagram} onChange={e => set('instagram', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input id="website" type="url" placeholder="https://rainbowcollective.in"
                value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
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

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>

          <p className="apply__footer">
            Already approved? <Link to="/admin">Sign in to your portal</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
