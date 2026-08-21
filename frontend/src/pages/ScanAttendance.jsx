import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axiosInstance';

const READER_ID = 'qr-reader';

export default function ScanAttendance() {
  const [state, setState] = useState('idle'); // idle | scanning | submitting | success | error
  const [message, setMessage] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (state === 'scanning') {
      initScanner();
    }
    return () => {
      if (state !== 'scanning') stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => stopScanner, []); // cleanup on unmount

  async function stopScanner() {
    const instance = scannerRef.current;
    if (!instance) return;
    try {
      await instance.stop();
      instance.clear();
    } catch {
      // scanner may already be stopped — safe to ignore
    }
    scannerRef.current = null;
  }

  async function initScanner() {
    const html5Qr = new Html5Qrcode(READER_ID);
    scannerRef.current = html5Qr;
    try {
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        onDecoded,
        () => {} // per-frame "no code found" noise — ignore
      );
    } catch (err) {
      setState('error');
      setMessage('Could not access the camera. Check permissions and try again.');
    }
  }

  async function onDecoded(decodedText) {
    await stopScanner();
    setState('submitting');
    try {
      const payload = JSON.parse(decodedText);
      const res = await api.post('/attendance/scan', payload);
      setMessage(res.data.message || 'Attendance recorded');
      setState('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'That QR code did not work. Try scanning again.');
      setState('error');
    }
  }

  return (
    <div className="scan-page">
      {state === 'idle' && (
        <div className="scan-page__intro">
          <p className="eyebrow">Scan Attendance</p>
          <h1>Point your camera at the screen</h1>
          <p className="scan-page__hint">
            The code refreshes automatically — as long as you're scanning, you're fine.
          </p>
          <button className="btn btn-primary" onClick={() => setState('scanning')}>
            Open Camera
          </button>
        </div>
      )}

      {state === 'scanning' && (
        <div className="scan-page__viewfinder">
          <div id={READER_ID} className="scan-page__reader" />
          <div className="scan-frame">
            <span className="scan-frame__corner scan-frame__corner--tl" />
            <span className="scan-frame__corner scan-frame__corner--tr" />
            <span className="scan-frame__corner scan-frame__corner--bl" />
            <span className="scan-frame__corner scan-frame__corner--br" />
          </div>
          <p className="scan-page__caption">Align the QR code within the frame</p>
        </div>
      )}

      {state === 'submitting' && (
        <div className="scan-page__status">
          <div className="spinner" />
          <p>Marking your attendance…</p>
        </div>
      )}

      {state === 'success' && (
        <div className="scan-page__status scan-page__status--success">
          <div className="check-mark">✓</div>
          <h2>You're checked in</h2>
          <p>{message}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="scan-page__status scan-page__status--error">
          <div className="check-mark check-mark--error">✕</div>
          <h2>Couldn't mark attendance</h2>
          <p>{message}</p>
          <button className="btn btn-primary" onClick={() => setState('scanning')}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
