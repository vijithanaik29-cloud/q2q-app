import { Link } from 'react-router-dom';
import './Legal.css';

export default function Privacy() {
  return (
    <div className="legal fade-up">
      <div className="container">

        <div className="legal__nav">
          <Link to="/privacy" className="active">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>

        <div className="legal__header">
          <span className="legal__tag">Legal</span>
          <h1>Privacy Policy</h1>
          <p className="legal__meta">Effective date: 1 November 2026 &nbsp;·&nbsp; Last updated: 30 October 2026</p>
        </div>

        <div className="legal__body">
          <div className="legal__highlight">
            Q2Q is India's queer events discovery and ticketing platform. We collect the minimum information needed to process your booking and keep you updated about events you attend. We do not sell your data.
          </div>

          <h2>1. Who we are</h2>
          <p>
            Q2Q ("we", "us", "our") operates the website at <strong>q2q.co.in</strong> and the Q2Q ticketing platform. For questions about this policy, write to us at <a href="mailto:hello@q2q.in">hello@q2q.in</a>.
          </p>

          <h2>2. What data we collect and why</h2>
          <p><strong>When you book a ticket (attendees):</strong></p>
          <ul>
            <li><strong>Full name</strong> — to identify you at check-in and print on your ticket</li>
            <li><strong>Email address</strong> — to send your booking confirmation and ticket</li>
            <li><strong>Mobile number</strong> — required by our payment partner Razorpay to process paid tickets; also used if the event organiser needs to reach you urgently</li>
          </ul>
          <p><strong>When you apply to list events (organisers):</strong></p>
          <ul>
            <li><strong>Name, organisation name, email, phone, city</strong> — to verify your identity and contact you about your application</li>
            <li><strong>Social media links and website</strong> (optional) — to verify you are a legitimate event organiser</li>
            <li><strong>Event format preferences</strong> (optional) — to understand the kind of events you run</li>
          </ul>
          <p><strong>We do not collect:</strong> government IDs, Aadhaar, PAN, bank account details from attendees, or any sensitive personal data beyond what is listed above.</p>

          <h2>3. Payment data</h2>
          <p>
            All payments are processed by <strong>Razorpay</strong> (Razorpay Software Private Limited). Q2Q never sees, stores, or handles your card number, UPI ID, or banking credentials. Razorpay's own privacy policy governs how they handle payment data. When you pay through Q2Q, you are also subject to <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">Razorpay's Privacy Policy</a>.
          </p>

          <h2>4. How we use your data</h2>
          <ul>
            <li>Sending your booking confirmation and ticket</li>
            <li>Processing refunds if an event is cancelled</li>
            <li>Contacting you about significant changes to an event you have booked (e.g. venue change, cancellation)</li>
            <li>Verifying and onboarding event organisers</li>
            <li>Complying with applicable Indian law</li>
          </ul>
          <p>We do not use your data for advertising, profiling, or any purpose other than those listed above.</p>

          <h2>5. Who we share data with</h2>
          <ul>
            <li><strong>Razorpay</strong> — your name, email, and phone are passed to Razorpay's checkout form to prefill your payment details. Razorpay processes the transaction and sends you a payment receipt.</li>
            <li><strong>Supabase</strong> — our database provider (hosted in Mumbai, India). Booking records are stored on Supabase's servers under strict access controls.</li>
            <li><strong>Event organisers</strong> — organiser accounts can see the name, email, and phone of attendees who booked tickets for their events. They are not permitted to use this data for any purpose other than managing that event.</li>
          </ul>
          <p>We do not sell, rent, or share your personal data with any other third party.</p>

          <h2>6. Data retention</h2>
          <ul>
            <li><strong>Booking records</strong> — kept for 2 years from the event date for financial record-keeping, then deleted</li>
            <li><strong>Organiser applications</strong> — kept for 1 year, then deleted</li>
            <li><strong>Organiser accounts</strong> — kept until the organiser requests deletion</li>
          </ul>

          <h2>7. Your rights</h2>
          <p>Under the Digital Personal Data Protection Act 2023 (India), you have the right to:</p>
          <ul>
            <li>Know what personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>To exercise any of these rights, email us at <a href="mailto:hello@q2q.in">hello@q2q.in</a>. We will respond within 30 days.</p>

          <h2>8. Cookies and tracking</h2>
          <p>
            Q2Q uses only functional browser storage (localStorage) to remember your preferred city and event category between visits. We do not use tracking cookies, advertising pixels, or third-party analytics tools.
          </p>

          <h2>9. Data security</h2>
          <p>
            Booking data is protected by Supabase Row Level Security (RLS), which means your booking information is not accessible to anyone without an authenticated organiser account. All data is transmitted over HTTPS. Our Razorpay secret keys are stored server-side and never exposed to the browser.
          </p>

          <h2>10. Children</h2>
          <p>
            Q2Q is not intended for use by anyone under 18 years of age. We do not knowingly collect personal data from minors. Events marked "18+" or "21+" require attendees to verify their age at the venue.
          </p>

          <h2>11. Changes to this policy</h2>
          <p>
            If we make material changes to this policy, we will update the "Last updated" date above and, where possible, notify organiser account holders by email. Continued use of Q2Q after changes constitutes acceptance of the updated policy.
          </p>

          <h2>12. Contact</h2>
          <p>
            For any privacy-related questions or requests, contact us at <a href="mailto:hello@q2q.in">hello@q2q.in</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
