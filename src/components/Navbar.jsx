import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="container navbar__inner">
          <Link to="/" className="navbar__logo">
            <span className="navbar__logo-q rainbow-text">Q2Q</span>
            <span className="navbar__logo-tag">queer events india</span>
          </Link>

          <div className="navbar__links">
            <NavLink to="/" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`} end>
              Events
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => `navbar__link navbar__link--organiser ${isActive ? 'navbar__link--active' : ''}`}>
              Verified Organiser
              <span className="navbar__info-icon" aria-label="What is a Verified Organiser?">
                ℹ
                <span className="navbar__tooltip">
                  Only for organizers approved by Q2Q.<br/>
                  New? Use "Host an Event" to apply.
                </span>
              </span>
            </NavLink>
            <Link to="/apply" className="navbar__cta">Host an Event</Link>
          </div>

          <button
            className={`navbar__hamburger ${open ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {open && <div className="navbar__overlay" onClick={() => setOpen(false)} />}

      <div className={`navbar__drawer ${open ? 'navbar__drawer--open' : ''}`}>
        <div className="navbar__drawer-section">
          <p className="navbar__drawer-label">Explore</p>
          <NavLink to="/" className="navbar__mobile-link" end>
            <span className="navbar__mobile-icon">🏳️‍🌈</span>
            <span className="navbar__mobile-link-content">
              <span className="navbar__mobile-link-title">Events</span>
              <span className="navbar__mobile-link-sub">Browse queer events near you</span>
            </span>
          </NavLink>
          <NavLink to="/admin" className="navbar__mobile-link">
            <span className="navbar__mobile-icon">✓</span>
            <span className="navbar__mobile-link-content">
              <span className="navbar__mobile-link-title">Verified Organiser</span>
              <span className="navbar__mobile-link-sub">For Q2Q-approved organizers only</span>
            </span>
          </NavLink>
        </div>

        <div className="navbar__drawer-divider" />

        <div className="navbar__drawer-section">
          <p className="navbar__drawer-label">Are you an organizer?</p>
          <Link to="/apply" className="navbar__drawer-cta">
            Host an Event on Q2Q
            <span className="navbar__drawer-cta-arrow">→</span>
          </Link>
        </div>

        <div className="navbar__drawer-footer">
          <span className="rainbow-text" style={{ fontWeight: 800, fontSize: 18 }}>Q2Q</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Queer Events India</span>
        </div>
      </div>
    </>
  );
}
