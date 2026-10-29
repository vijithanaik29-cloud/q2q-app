import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../data/events';
import './Booking.css';

export default function Booking() {
  const { id } = useParams();
  const { allEvents, addBooking } = useApp();
  const navigate = useNavigate();

  const event = allEvents.find(e => e.id === id);

  const [quantities,    setQuantities]    = useState({});
  const [step,          setStep]          = useState(1);
  const [form,          setForm]          = useState({ name: '', email: '', phone: '' });
  const [errors,        setErrors]        = useState({});
  const [submitting,    setSubmitting]    = useState(false);
  const [paymentError,  setPaymentError]  = useState('');
  const [consent,       setConsent]       = useState(false);

  if (!event) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <h3>Event not found</h3>
          <Link to="/" className="btn btn-primary">Back to Events</Link>
        </div>
      </div>
    );
  }

  function setQty(ticketId, delta) {
    setQuantities(prev => {
      const cur  = prev[ticketId] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [ticketId]: next };
    });
  }

  const selectedTickets = event.tickets
    .filter(t => (quantities[t.id] || 0) > 0)
    .map(t => ({ ...t, qty: quantities[t.id] }));

  const total    = selectedTickets.reduce((sum, t) => sum + t.price * t.qty, 0);
  const totalQty = selectedTickets.reduce((sum, t) => sum + t.qty, 0);
  const hasSelection = totalQty > 0;

  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid Indian mobile number';
    return errs;
  }

  function handleDetailsSubmit(e) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(3);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setPaymentError('');

    const bookingData = {
      eventId:    event.id,
      eventTitle: event.title,
      eventDate:  event.date,
      eventVenue: event.venue,
      eventCity:  event.city,
      gradient:   event.gradient,
      tickets:    selectedTickets,
      total,
      attendee:   form,
    };

    try {
      // Free tickets — save directly to Supabase (no payment needed)
      if (total === 0) {
        const booking = await addBooking(bookingData);
        navigate('/confirmation', { state: { booking, event } });
        return;
      }

      // Paid tickets — Razorpay flow
      // Step 1: create a Razorpay order via edge function
      const { data: order, error: orderErr } = await supabase.functions.invoke('create-order', {
        body: { amount: total * 100, receipt: `Q2Q-${Date.now()}` },
      });
      if (orderErr) throw new Error(orderErr.message);

      // Step 2: open Razorpay checkout; on success call confirm-booking edge function
      const booking = await new Promise((resolve, reject) => {
        const options = {
          key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
          order_id:    order.id,
          amount:      order.amount,
          currency:    order.currency,
          name:        'Q2Q',
          description: event.title,
          prefill:     { name: form.name, email: form.email, contact: form.phone },
          theme:       { color: '#9333EA' },
          handler: async (response) => {
            const { data, error } = await supabase.functions.invoke('confirm-booking', {
              body: { payment: response, booking: bookingData },
            });
            if (error) reject(new Error(error.message));
            else resolve(data.booking);
          },
          modal: { ondismiss: () => reject(new Error('cancelled')) },
        };
        // Razorpay script is loaded in index.html
        const rzp = new window.Razorpay(options);
        rzp.open();
      });

      navigate('/confirmation', { state: { booking, event } });
    } catch (err) {
      if (err.message !== 'cancelled') {
        setPaymentError('Payment failed or could not be verified. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="booking fade-up">
      <div className="container">
        {/* Progress */}
        <div className="booking__progress">
          {['Select Tickets', 'Your Details', 'Confirm'].map((label, i) => (
            <div key={i} className={`booking__step ${step > i + 1 ? 'booking__step--done' : ''} ${step === i + 1 ? 'booking__step--active' : ''}`}>
              <div className="booking__step-num">{step > i + 1 ? '✓' : i + 1}</div>
              <span className="booking__step-label">{label}</span>
              {i < 2 && <div className={`booking__step-line ${step > i + 1 ? 'booking__step-line--done' : ''}`} />}
            </div>
          ))}
        </div>

        <div className="booking__layout">
          {/* Main area */}
          <div className="booking__main">
            {/* Step 1: Ticket selection */}
            {step === 1 && (
              <div className="booking__panel">
                <h2 className="booking__panel-title">Select Tickets</h2>
                <div className="booking__tickets">
                  {event.tickets.map(ticket => (
                    <div key={ticket.id} className={`booking__ticket-row ${(quantities[ticket.id] || 0) > 0 ? 'booking__ticket-row--selected' : ''}`}>
                      <div className="booking__ticket-info">
                        <div className="booking__ticket-name">{ticket.type}</div>
                        <div className="booking__ticket-desc">{ticket.description}</div>
                        <div className="booking__ticket-avail">{ticket.available} available</div>
                      </div>
                      <div className="booking__ticket-right">
                        <div className="booking__ticket-price">
                          {ticket.price === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : `₹${ticket.price.toLocaleString('en-IN')}`}
                        </div>
                        <div className="booking__qty">
                          <button className="booking__qty-btn" onClick={() => setQty(ticket.id, -1)} disabled={(quantities[ticket.id] || 0) === 0}>−</button>
                          <span className="booking__qty-num">{quantities[ticket.id] || 0}</span>
                          <button className="booking__qty-btn" onClick={() => setQty(ticket.id, 1)} disabled={(quantities[ticket.id] || 0) >= Math.min(10, ticket.available)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-full btn-lg"
                  disabled={!hasSelection}
                  onClick={() => setStep(2)}
                >
                  Continue {hasSelection ? `· ${totalQty} ticket${totalQty > 1 ? 's' : ''}` : ''}
                </button>
              </div>
            )}

            {/* Step 2: Attendee details */}
            {step === 2 && (
              <form className="booking__panel" onSubmit={handleDetailsSubmit} noValidate>
                <button type="button" className="booking__back-step" onClick={() => setStep(1)}>
                  ← Back to tickets
                </button>
                <h2 className="booking__panel-title">Your Details</h2>
                <p className="booking__panel-sub">Tickets will be sent to the email below.</p>

                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input id="name" type="text" placeholder="Priya Sharma" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  {errors.name && <span className="booking__error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input id="email" type="email" placeholder="priya@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  {errors.email && <span className="booking__error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Mobile Number</label>
                  <input id="phone" type="tel" placeholder="9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  {errors.phone && <span className="booking__error">{errors.phone}</span>}
                </div>

                <p className="booking__privacy">
                  Your details are only used to send your booking confirmation.
                </p>

                <button type="submit" className="btn btn-primary btn-full btn-lg">
                  Review order
                </button>
              </form>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="booking__panel">
                <button type="button" className="booking__back-step" onClick={() => setStep(2)}>
                  ← Edit details
                </button>
                <h2 className="booking__panel-title">Confirm Booking</h2>

                <div className="booking__confirm-details">
                  <div className="booking__confirm-row">
                    <span>Name</span><strong>{form.name}</strong>
                  </div>
                  <div className="booking__confirm-row">
                    <span>Email</span><strong>{form.email}</strong>
                  </div>
                  <div className="booking__confirm-row">
                    <span>Phone</span><strong>{form.phone}</strong>
                  </div>
                </div>

                <div className="divider" />

                <div className="booking__confirm-tickets">
                  {selectedTickets.map(t => (
                    <div key={t.id} className="booking__confirm-ticket">
                      <span>{t.type} × {t.qty}</span>
                      <strong>{t.price === 0 ? 'Free' : `₹${(t.price * t.qty).toLocaleString('en-IN')}`}</strong>
                    </div>
                  ))}
                </div>

                <div className="booking__confirm-total">
                  <span>Total</span>
                  <strong>{total === 0 ? 'Free' : `₹${total.toLocaleString('en-IN')}`}</strong>
                </div>

                <label className="booking__consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                  />
                  <span>
                    I understand that <strong>Q2Q is a ticketing platform only</strong>. This event is organised
                    and managed solely by <strong>{event.organizer}</strong>. Q2Q is not responsible for any
                    changes, cancellations, or issues with the event.
                  </span>
                </label>

                {paymentError && (
                  <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                    {paymentError}
                  </p>
                )}

                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleConfirm}
                  disabled={submitting || !consent}
                  style={{ marginTop: 16 }}
                >
                  {submitting ? (
                    <><div className="spinner" style={{ width: 16, height: 16 }} /> Processing…</>
                  ) : total === 0 ? 'Confirm booking' : `Pay ₹${total.toLocaleString('en-IN')}`}
                </button>

                <p className="booking__privacy" style={{ marginTop: 12 }}>
                  {total > 0 ? 'Secure payment via Razorpay.' : 'No payment required for free tickets.'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar: order summary */}
          <aside className="booking__sidebar">
            <div className="booking__summary card">
              <div className="booking__summary-banner" style={{ background: event.gradient }} />
              <div className="booking__summary-body">
                <h3 className="booking__summary-title">{event.title}</h3>
                <div className="booking__summary-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(event.date)}, {event.time}
                </div>
                <div className="booking__summary-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {event.venue}, {event.city}
                </div>

                {hasSelection && (
                  <>
                    <div className="divider" style={{ margin: '16px 0' }} />
                    {selectedTickets.map(t => (
                      <div key={t.id} className="booking__summary-line">
                        <span>{t.type} × {t.qty}</span>
                        <span>{t.price === 0 ? 'Free' : `₹${(t.price * t.qty).toLocaleString('en-IN')}`}</span>
                      </div>
                    ))}
                    <div className="booking__summary-total">
                      <span>Total</span>
                      <strong>{total === 0 ? 'Free' : `₹${total.toLocaleString('en-IN')}`}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
