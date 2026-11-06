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
            Q2Q is a discovery and ticketing platform for queer events across India. At present, Q2Q does not process any payments — all events listed on Q2Q are free to attend and no money is collected from attendees.
          </div>

          <h2>1. No payments are currently processed</h2>
          <p>
            Q2Q does not currently charge attendees for tickets. All RSVPs and bookings on the platform are free of charge. Because no payment is collected, there is nothing to refund.
          </p>

          <h2>2. Future paid events</h2>
          <p>
            When Q2Q introduces paid ticketing, this policy will be updated to cover refund eligibility, the process for requesting a refund, and timelines. We will notify organiser account holders by email before paid ticketing goes live.
          </p>

          <h2>3. Event cancellations</h2>
          <p>
            If an event you have RSVP'd to is cancelled by the organiser, you will be notified by email. No financial action is needed as no payment was taken.
          </p>

          <h2>4. Contact</h2>
          <p>
            For any questions, write to us at <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a>. We typically respond within 2 business days. Support hours: Monday to Friday, 10 AM–6 PM IST.
          </p>
        </div>

      </div>
    </div>
  );
}
