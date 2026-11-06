import { Link } from 'react-router-dom';
import './Legal.css';

export default function About() {
  return (
    <div className="legal-page container fade-up">
      <h1>About Q2Q</h1>

      <section>
        <h2>What We Do</h2>
        <p>
          Q2Q is an online event ticketing and fundraising platform built for India's LGBTQ+ community.
          We help event organisers list, manage, and sell tickets to queer-friendly events — including
          parties, pride marches, film festivals, workshops, art shows, and community gatherings — across
          cities in India.
        </p>
      </section>

      <section>
        <h2>Our Services</h2>
        <ul>
          <li>Online event ticketing and seat management</li>
          <li>Secure payment collection and booking confirmation</li>
          <li>QR-code based entry verification for organisers</li>
          <li>Community fundraising for LGBTQ+ causes</li>
          <li>Organiser dashboard for event and attendee management</li>
        </ul>
      </section>

      <section>
        <h2>Who We Serve</h2>
        <p>
          Q2Q serves event organisers and attendees across India. Organisers use Q2Q to publish events
          and manage ticket sales. Attendees use Q2Q to discover and book tickets to events in their city.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For support or business enquiries, reach us at{' '}
          <a href="mailto:hello@q2q.co.in">hello@q2q.co.in</a>.
        </p>
        <p>
          Our policies: <Link to="/terms">Terms of Service</Link> ·{' '}
          <Link to="/privacy">Privacy Policy</Link> ·{' '}
          <Link to="/refund">Refund Policy</Link>
        </p>
      </section>
    </div>
  );
}
