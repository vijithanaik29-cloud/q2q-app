import { Link } from 'react-router-dom';
import './Legal.css';

export default function Refund() {
  return (
    <div className="legal fade-up">
      <div className="container">

        <div className="legal__nav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/refund" className="active">Refund Policy</Link>
        </div>

        <div className="legal__header">
          <span className="legal__tag">Legal</span>
          <h1>Refund &amp; Cancellation Policy</h1>
          <p className="legal__meta">Effective date: 1 November 2026 &nbsp;·&nbsp; Last updated: 1 November 2026</p>
        </div>

        <div className="legal__body">
          <div className="legal__highlight">
            Q2Q is a discovery and ticketing platform for queer events across India. This policy covers event cancellations, attendee no-shows, and refunds. Q2Q will be introducing paid ticket booking — when it goes live, the refund sections below will apply in full.
          </div>

          <h2>1. Event cancellation by organiser</h2>
          <p>
            If an organiser cancels an event, Q2Q will mark the event as cancelled and notify all RSVP'd attendees by email. The event will be removed from public listings.
          </p>
          <ul>
            <li><strong>Free events</strong> — no financial action is needed. Your RSVP will be automatically cancelled.</li>
            <li><strong>Paid events</strong> — a full refund of the ticket price will be issued to your original payment method within 5–7 business days.</li>
          </ul>

          <h2>2. Event postponement or venue change</h2>
          <p>
            If an organiser postpones an event or changes its venue, they must notify Q2Q and all RSVP'd attendees promptly. Your existing booking remains valid for the rescheduled event unless you choose to cancel it.
          </p>
          <ul>
            <li><strong>Free events</strong> — to cancel your RSVP, write to <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a> with your booking ID.</li>
            <li><strong>Paid events</strong> — if you cannot attend the new date, write to us within 48 hours of the rescheduling announcement and we will process a full refund.</li>
          </ul>

          <h2>3. Attendee cancellations</h2>
          <p>
            To cancel your booking, write to <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a> with your booking ID. We encourage attendees to cancel as soon as they know they cannot attend so the organiser can offer the spot to someone else.
          </p>
          <ul>
            <li><strong>Free events</strong> — cancellations are accepted at any time before the event. No penalty applies.</li>
            <li><strong>Paid events</strong> — cancellations are not eligible for a refund unless the event is cancelled or rescheduled by the organiser (see sections 1 and 2 above).</li>
          </ul>

          <h2>4. No-shows</h2>
          <p>
            If you do not attend an event you booked without cancelling in advance, your booking is marked as a no-show. No penalty applies for a single no-show. However, repeated no-shows may result in Q2Q limiting your ability to book future events.
          </p>
          <ul>
            <li><strong>Paid events</strong> — no-shows are not eligible for a refund.</li>
          </ul>

          <h2>5. Refund eligibility summary (paid events)</h2>
          <ul>
            <li>Event cancelled by organiser → <strong>full refund</strong></li>
            <li>Event postponed and you cannot attend → <strong>full refund</strong> (request within 48 hours)</li>
            <li>Duplicate payment due to technical error → <strong>full refund</strong></li>
            <li>Payment deducted but no booking confirmed → <strong>full refund</strong> (write to us with payment reference)</li>
            <li>Buyer-initiated cancellation → <strong>no refund</strong></li>
            <li>No-show → <strong>no refund</strong></li>
            <li>Dissatisfaction after attending → <strong>no refund</strong></li>
          </ul>

          <h2>6. How to request a refund (paid events)</h2>
          <p>
            Email <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a> with:
          </p>
          <ul>
            <li>Your Q2Q booking ID</li>
            <li>The reason for your refund request</li>
            <li>Your Razorpay payment ID or UPI reference number (optional — speeds up processing)</li>
          </ul>
          <p>
            Approved refunds are credited to your original payment method within 5–7 business days. Support hours: Monday to Friday, 10 AM–6 PM IST.
          </p>

          <h2>7. Contact</h2>
          <p>
            For any questions about cancellations or refunds, write to <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a>. We typically respond within 2 business days.
          </p>
        </div>

      </div>
    </div>
  );
}
