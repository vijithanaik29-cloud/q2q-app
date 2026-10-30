import { Link } from 'react-router-dom';
import './Legal.css';

export default function Terms() {
  return (
    <div className="legal fade-up">
      <div className="container">

        <div className="legal__nav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms" className="active">Terms of Service</Link>
        </div>

        <div className="legal__header">
          <span className="legal__tag">Legal</span>
          <h1>Terms of Service</h1>
          <p className="legal__meta">Effective date: 1 November 2026 &nbsp;·&nbsp; Last updated: 30 October 2026</p>
        </div>

        <div className="legal__body">
          <div className="legal__highlight">
            By booking a ticket or listing an event on Q2Q, you agree to these terms. Please read them carefully — in particular, the section on refunds and Q2Q's role as a ticketing platform only.
          </div>

          <h2>1. What Q2Q is</h2>
          <p>
            Q2Q is an online discovery and ticketing platform for LGBTQ+ events in India. Q2Q connects event organisers with attendees. <strong>Q2Q does not organise, host, or manage any events.</strong> Each event listed on Q2Q is independently organised and managed by the organiser named on the event page.
          </p>

          <h2>2. For attendees</h2>

          <p><strong>Bookings</strong></p>
          <p>
            When you book a ticket through Q2Q, your contract for the event is with the event organiser, not with Q2Q. Q2Q processes the transaction as the payment facilitator and issues your ticket confirmation.
          </p>

          <p><strong>Refunds</strong></p>
          <ul>
            <li>Refunds are only issued if the event is <strong>cancelled by the organiser</strong>.</li>
            <li>If an event is postponed or relocated, the organiser will contact you with updated details. Tickets remain valid for the rescheduled event unless the organiser offers a refund.</li>
            <li>Q2Q does not issue refunds for change of mind, inability to attend, or dissatisfaction with the event.</li>
            <li>When a refund is issued, it is returned to your original payment method within 5–7 business days via Razorpay.</li>
          </ul>

          <p><strong>Ticket transfers</strong></p>
          <p>
            Tickets are personal and issued in the name of the attendee who booked. Transfers are not permitted unless the organiser explicitly allows them for a specific event.
          </p>

          <p><strong>Age restrictions</strong></p>
          <p>
            Events marked "18+" or "21+" require valid age verification at the venue entrance. Q2Q is not responsible if an attendee is denied entry due to age.
          </p>

          <p><strong>Safe space</strong></p>
          <p>
            All events listed on Q2Q are expected to be safe, inclusive spaces for LGBTQ+ people. Attendees who engage in harassment, discrimination, or hate speech may be removed from an event by the organiser and may have their Q2Q booking cancelled without a refund.
          </p>

          <h2>3. For event organisers</h2>

          <p><strong>Application and approval</strong></p>
          <p>
            To list events on Q2Q, you must apply and be approved. Q2Q reserves the right to approve or decline applications at its discretion. Approval is not a guarantee that any specific event will be published.
          </p>

          <p><strong>Platform fee</strong></p>
          <ul>
            <li>Q2Q charges a <strong>10% platform fee</strong> on every paid ticket sold through the platform.</li>
            <li>Free events carry no platform fee.</li>
            <li>Earnings are paid out to your registered bank account typically <strong>7 days after the event date</strong>, subject to no refund disputes being open.</li>
          </ul>

          <p><strong>Sponsored placement</strong></p>
          <ul>
            <li>Organisers may pay for sponsored placement (Event Boost or Event Spotlight) to feature their event at the top of listings until the event date. This is a one-time, per-event fee.</li>
            <li>Sponsored placement fees are non-refundable once the listing goes live.</li>
          </ul>

          <p><strong>Organiser responsibilities</strong></p>
          <p>By listing an event on Q2Q, you confirm that:</p>
          <ul>
            <li>You have all necessary permissions, licences, and venue approvals to hold the event</li>
            <li>The event details you list (date, time, venue, price) are accurate</li>
            <li>You will notify Q2Q and all ticket holders promptly if the event is cancelled, postponed, or relocated</li>
            <li>You will not discriminate against any attendee on the basis of gender identity, sexual orientation, caste, religion, disability, or any other protected characteristic</li>
            <li>Attendee data (name, email, phone) shared with you by Q2Q will only be used to manage your event and will not be shared with any third party</li>
          </ul>

          <p><strong>Event removal</strong></p>
          <p>
            Q2Q may remove any event listing that violates these terms, contains false information, or is inconsistent with Q2Q's commitment to being a safe space for the queer community. In cases of cancellation due to a violation, the organiser is responsible for refunding all ticket holders.
          </p>

          <h2>4. Q2Q's liability</h2>
          <p>
            Q2Q is a technology platform. To the maximum extent permitted by law:
          </p>
          <ul>
            <li>Q2Q is not liable for the quality, safety, legality, or cancellation of any event listed on the platform</li>
            <li>Q2Q is not liable for any loss or damage arising from your attendance at an event</li>
            <li>Q2Q's total liability for any claim is limited to the amount you paid for the ticket in question</li>
          </ul>

          <h2>5. Intellectual property</h2>
          <p>
            The Q2Q name, logo, and platform design are owned by Q2Q. Event organisers retain ownership of their event descriptions, images, and content. By listing on Q2Q, organisers grant Q2Q a non-exclusive licence to display that content on the platform and in promotional materials related to Q2Q.
          </p>

          <h2>6. Governing law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes arising from them will be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.
          </p>

          <h2>7. Changes to these terms</h2>
          <p>
            Q2Q may update these terms from time to time. Material changes will be communicated to organiser account holders by email. Continued use of Q2Q after changes constitutes acceptance.
          </p>

          <h2>8. Contact</h2>
          <p>
            For any questions about these terms, write to <a href="mailto:hello@q2q.in">hello@q2q.in</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
