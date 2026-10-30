import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__rainbow" />
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo rainbow-text">Q2Q</span>
          <p className="footer__tagline">Connecting queer communities across India, one event at a time.</p>
        </div>

        <div className="footer__links">
          <div className="footer__col">
            <h4>Discover</h4>
            <Link to="/">All Events</Link>
            <Link to="/stories">Stories</Link>
            <Link to="/?city=Mumbai">Mumbai</Link>
            <Link to="/?city=Delhi">Delhi</Link>
            <Link to="/?city=Bangalore">Bangalore</Link>
          </div>
          <div className="footer__col">
            <h4>My Account</h4>
            <Link to="/my-bookings">My Tickets</Link>
          </div>
          <div className="footer__col">
            <h4>Organizers</h4>
            <Link to="/admin">Submit Event</Link>
            <Link to="/admin">My Events</Link>
          </div>
          <div className="footer__col">
            <h4>Support</h4>
            <a href="mailto:hello@q2q.in">Contact Us</a>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© 2026 Q2Q. Made with 🏳️‍🌈 in India.</p>
        <p className="footer__safe-note">Q2Q is committed to being a safe, inclusive platform for all queer identities.</p>
      </div>
    </footer>
  );
}
