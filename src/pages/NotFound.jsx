import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ padding: '100px 0', textAlign: 'center' }} className="fade-up">
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20 }}>404</p>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '-1px', marginBottom: 12 }}>Page not found</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: 32, fontSize: 15 }}>This page doesn't exist, but plenty of great events do.</p>
      <Link to="/" className="btn btn-primary">Back to events</Link>
    </div>
  );
}
