import { useEffect, useRef, useState } from 'react';
import './RainbowCelebration.css';

const PRIDE   = ['#E40303','#FF8C00','#FFED00','#008026','#004DFF','#750787'];
const PALETTE = [...PRIDE, '#55CDFC','#F7A8B8','#FFFFFF','#FF69B4'];

function burst(canvas, cx, cy, count = 120) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 14 + 4;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: Math.random() * 10 + 4,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      gravity: 0.28,
      life: 1,
      decay: Math.random() * 0.007 + 0.003,
    });
  }
  return particles;
}

function rain(canvas) {
  return {
    x: Math.random() * canvas.width,
    y: -12,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 5 + 3,
    size: Math.random() * 9 + 3,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    gravity: 0.14,
    life: 1,
    decay: Math.random() * 0.005 + 0.002,
  };
}

export default function RainbowCelebration({ onDone }) {
  const canvasRef   = useRef(null);
  const particles   = useRef([]);
  const rafRef      = useRef(null);
  const [phase, setPhase] = useState('drumroll');

  // Advance from drum-roll → burst after 1.8 s
  useEffect(() => {
    const t = setTimeout(() => setPhase('burst'), 1800);
    return () => clearTimeout(t);
  }, []);

  // Run canvas when burst starts
  useEffect(() => {
    if (phase !== 'burst') return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial burst from centre
    particles.current = burst(canvas, canvas.width / 2, canvas.height * 0.35, 140);

    // Sustained rain
    let drops = 0;
    const rainTimer = setInterval(() => {
      for (let i = 0; i < 10; i++) particles.current.push(rain(canvas));
      if (++drops > 28) clearInterval(rainTimer);
    }, 100);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.life > 0);
      for (const p of particles.current) {
        p.x        += p.vx;
        p.y        += p.vy;
        p.vy       += p.gravity;
        p.vx       *= 0.99;
        p.rotation += p.spin;
        p.life     -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3.5, p.size, p.size / 2.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    const doneTimer = setTimeout(() => {
      setPhase('done');
      onDone?.();
    }, 4200);

    return () => {
      clearInterval(rainTimer);
      clearTimeout(doneTimer);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [phase, onDone]);

  if (phase === 'done') return null;

  return (
    <div className={`rcl rcl--${phase}`} aria-hidden="true">
      {phase === 'drumroll' && (
        <div className="rcl__roll">
          <div className="rcl__beats">
            {PRIDE.map((c, i) => (
              <span key={i} className="rcl__beat" style={{ '--c': c, '--d': `${i * 0.18}s` }} />
            ))}
          </div>
          <p className="rcl__label">get ready…</p>
          <div className="rcl__bar">
            <div className="rcl__bar-fill" />
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="rcl__canvas" />
    </div>
  );
}
