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
            Q2Q is a discovery and ticketing platform for queer events across India. This policy explains when refunds are issued, how to request one, and how long they take. Please read it before purchasing a ticket.
          </div>

          <h2>1. Tickets are generally non-refundable</h2>
          <p>
            All ticket sales are final. Once a booking is confirmed and a booking ID is issued, tickets cannot be cancelled or refunded except in the circumstances described below. This policy exists because event organisers plan capacity, staffing, and logistics based on confirmed bookings.
          </p>

          <h2>2. When you are entitled to a full refund</h2>
          <p>You will receive a full refund in the following situations:</p>
          <ul>
            <li><strong>Event cancelled by the organiser</strong> — If the organiser cancels the event entirely, Q2Q will initiate a full refund of the ticket amount to your original payment method within 5–7 business days.</li>
            <li><strong>Event postponed and you cannot attend</strong> — If the event is rescheduled to a new date and you are unable to attend the new date, write to us within 48 hours of the rescheduling announcement and we will process a full refund.</li>
            <li><strong>Duplicate payment</strong> — If your account was charged more than once for the same booking due to a technical error, the extra charge will be refunded automatically within 5–7 business days.</li>
            <li><strong>Payment deducted but booking failed</strong> — If your payment was deducted but you did not receive a booking confirmation or booking ID, write to us at <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a> with your payment reference number. We will investigate and refund within 5–7 business days.</li>
          </ul>

          <h2>3. Situations where refunds are not issued</h2>
          <ul>
            <li>Buyer-initiated cancellation after booking is confirmed</li>
            <li>Inability to attend due to personal reasons (travel, illness, change of plans)</li>
            <li>Dissatisfaction with the event after attending</li>
            <li>Entry denied at the venue due to violation of the event's entry requirements or code of conduct</li>
            <li>Requests made after the event date has passed</li>
          </ul>

          <h2>4. Free events</h2>
          <p>
            Tickets for free events have no monetary value and do not qualify for refunds. If you registered for a free event and cannot attend, no action is needed.
          </p>

          <h2>5. How to request a refund</h2>
          <p>
            For eligible refunds, email <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a> with:
          </p>
          <ul>
            <li>Your Q2Q booking ID (format: Q2Q-XXXXX-XXXXX)</li>
            <li>The reason for the refund request</li>
            <li>Your Razorpay payment ID or UPI reference number (optional, speeds up processing)</li>
          </ul>
          <p>
            We aim to respond within 2 business days. Approved refunds are credited to your original payment method within 5–7 business days after approval, depending on your bank or card issuer.
          </p>

          <h2>6. Refund amounts</h2>
          <p>
            Refunds are issued for the ticket amount paid. Platform convenience fees, if any, are non-refundable.
          </p>

          <h2>7. Razorpay payment processing</h2>
          <p>
            All payments on Q2Q are processed securely by Razorpay. Refunds are processed through Razorpay back to your original payment method — credit/debit card, UPI, net banking, or wallet. Q2Q does not store your card or UPI details.
          </p>

          <h2>8. Contact</h2>
          <p>
            For any refund queries, write to us at <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a>. We typically respond within 2 business days, Monday to Friday.
          </p>
        </div>

      </div>
    </div>
  );
}
