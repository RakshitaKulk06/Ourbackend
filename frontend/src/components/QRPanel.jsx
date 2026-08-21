import { useEffect, useState } from 'react';

const SIZE = 220;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * qr: { qrImage, generatedAt, expiresAt, refreshMs } | null
 * sessionEnded: bool
 */
export default function QRPanel({ qr, sessionEnded }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!qr) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(qr.expiresAt) - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const handle = setInterval(tick, 200);
    return () => clearInterval(handle);
  }, [qr]);

  if (sessionEnded) {
    return (
      <div className="qr-panel qr-panel--ended">
        <div className="qr-panel__ended-mark">✕</div>
        <p className="eyebrow">Session closed</p>
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="qr-panel qr-panel--waiting">
        <p className="eyebrow">Generating first code…</p>
      </div>
    );
  }

  const isUrgent = secondsLeft !== null && secondsLeft <= 5;

  return (
    <div className={`qr-panel ${isUrgent ? 'qr-panel--urgent' : ''}`}>
      <div className="qr-panel__ring-wrap">
        <svg width={SIZE} height={SIZE} className="qr-panel__ring">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--hairline-strong)"
            strokeWidth={STROKE}
          />
          <circle
            key={qr.generatedAt}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={isUrgent ? 'var(--accent-warn)' : 'var(--accent-live)'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            className="qr-panel__ring-sweep"
            style={{ '--circumference': CIRCUMFERENCE, '--duration': `${qr.refreshMs}ms` }}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <img src={qr.qrImage} alt="Scan to mark attendance" className="qr-panel__image" />
      </div>
      <div className="qr-panel__countdown">
        <span className="qr-panel__seconds">{secondsLeft ?? '—'}</span>
        <span className="eyebrow">sec until refresh</span>
      </div>
    </div>
  );
}
