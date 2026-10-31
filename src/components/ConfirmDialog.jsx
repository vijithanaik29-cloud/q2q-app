import { useState } from 'react';

export default function ConfirmDialog({ dialog, onClose }) {
  const [running, setRunning] = useState(false);

  if (!dialog) return null;

  async function handleConfirm() {
    setRunning(true);
    try { await dialog.fn(); } finally { setRunning(false); onClose(); }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && !running) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px 28px 24px', maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          Confirm action
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 10, lineHeight: 1.25, letterSpacing: '-0.3px' }}>
          {dialog.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 26 }}>
          You are about to:{' '}
          <strong style={{ color: dialog.danger ? 'var(--error)' : 'var(--text)', fontWeight: 700 }}>
            {dialog.action}
          </strong>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={running}
            style={{
              padding: '9px 22px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-2)', background: 'transparent',
              color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={running}
            style={{
              padding: '9px 22px', borderRadius: 'var(--radius-full)', border: 'none',
              fontWeight: 700, fontSize: 13, cursor: running ? 'wait' : 'pointer',
              background: dialog.danger ? 'var(--error)' : 'var(--accent)',
              color: '#fff', opacity: running ? 0.72 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {running ? 'Processing…' : (dialog.confirmLabel || 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
