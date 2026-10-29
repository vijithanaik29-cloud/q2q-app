import { useState, useRef, useEffect } from 'react';

export default function QRVerifier({ bookings, checkedIn, onCheckIn }) {
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null);
  const [cameraState, setCameraState] = useState('idle'); // idle | requesting | active | error
  const [cameraMsg, setCameraMsg] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  function lookup(code) {
    const cleaned = code.trim().toUpperCase();
    const booking = bookings.find(b => b.id === cleaned);
    setResult({ booking: booking || null, code: cleaned });
    setManualCode('');
  }

  async function startCamera() {
    setCameraState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('active');

      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const hits = await detector.detect(videoRef.current);
            if (hits.length > 0) {
              lookup(hits[0].rawValue);
            }
          } catch { /* frame not ready */ }
        }, 600);
        setCameraMsg('Scanning for QR codes…');
      } else {
        setCameraMsg('Camera active. QR auto-detection unavailable in this browser. Enter code manually below.');
      }
    } catch (err) {
      setCameraState('error');
      setCameraMsg(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Use manual entry below.'
          : 'Camera unavailable. Use manual entry below.'
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    clearInterval(intervalRef.current);
    setCameraState('idle');
    setCameraMsg('');
  }

  useEffect(() => () => stopCamera(), []);

  const isValid = result?.booking != null;
  const isCheckedIn = result?.booking && checkedIn.has(result.booking.id);

  return (
    <div className="qrv">
      <p className="qrv__hint">
        Scan a guest's QR code with the camera, or type their booking reference below.
      </p>

      {/* Camera section */}
      <div className="qrv__camera-section">
        {cameraState === 'idle' && (
          <button className="qrv__camera-open btn btn-outline" onClick={startCamera}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Open Camera
          </button>
        )}

        {cameraState === 'requesting' && (
          <div className="qrv__camera-placeholder">
            <div className="spinner" />
            <span>Requesting camera…</span>
          </div>
        )}

        {cameraState === 'active' && (
          <div className="qrv__camera-wrap">
            <video ref={videoRef} className="qrv__video" playsInline muted autoPlay />
            <div className="qrv__scan-frame" />
            <div className="qrv__camera-footer">
              <span className="qrv__camera-status">
                <span className="qrv__dot" />
                {cameraMsg}
              </span>
              <button className="qrv__camera-stop" onClick={stopCamera}>Stop</button>
            </div>
          </div>
        )}

        {cameraState === 'error' && (
          <div className="qrv__camera-error">{cameraMsg}</div>
        )}
      </div>

      {/* Manual entry */}
      <div className="qrv__divider">
        <span>or enter booking reference</span>
      </div>

      <form className="qrv__form" onSubmit={e => { e.preventDefault(); if (manualCode.trim()) lookup(manualCode); }}>
        <input
          type="text"
          value={manualCode}
          onChange={e => setManualCode(e.target.value.toUpperCase())}
          placeholder="Q2Q-XXXXXXXX"
          className="qrv__input"
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary" disabled={!manualCode.trim()}>
          Verify
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`qrv__result ${isValid ? 'qrv__result--valid' : 'qrv__result--invalid'}`}>
          {isValid ? (
            <>
              <div className="qrv__result-status">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {isCheckedIn ? 'Already checked in' : 'Valid ticket'}
              </div>
              <div className="qrv__result-name">{result.booking.attendee.name}</div>
              <div className="qrv__result-meta">
                <span>{result.booking.tickets.map(t => `${t.type} × ${t.qty}`).join(', ')}</span>
                <span className="qrv__result-sep">·</span>
                <span className="qrv__result-ref">{result.booking.id}</span>
              </div>
              {isCheckedIn ? (
                <div className="qrv__already-in">Checked in</div>
              ) : (
                <button
                  className="btn btn-primary qrv__checkin-btn"
                  onClick={() => { onCheckIn(result.booking.id); setResult(r => ({ ...r })); }}
                >
                  Mark as checked in
                </button>
              )}
            </>
          ) : (
            <>
              <div className="qrv__result-status qrv__result-status--invalid">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Invalid ticket
              </div>
              <div className="qrv__result-meta">No booking found for <code>{result.code}</code></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
