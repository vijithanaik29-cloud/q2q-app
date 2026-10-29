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
          <NavLink to="/admin" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            For Organizers
          </NavLink>
        </div>

        <button
          className={`navbar__hamburger ${open ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {open && (
        <div className="navbar__mobile-menu">
          <NavLink to="/" className="navbar__mobile-link" end>Events</NavLink>
          <NavLink to="/admin" className="navbar__mobile-link">For Organizers</NavLink>
        </div>
      )}
    </nav>
  );
}
