import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthToken } from '../hooks/useAuthToken';

/**
 * STANDALONE-TESTING ONLY. The real Authentication Module already has a
 * login page — delete this file once this module is merged into the main
 * repo and just carry over whatever token the real login flow produces.
 */
export default function DevLogin() {
  const { token, role, setToken } = useAuthToken();
  const [input, setInput] = useState(token || '');
  const navigate = useNavigate();

  function save() {
    setToken(input.trim());
  }

  return (
    <div className="dev-login">
      <p className="eyebrow">Local testing only</p>
      <h1>Paste a JWT</h1>
      <p className="scan-page__hint">
        Run <code>npm run seed</code> in the backend, then paste an Admin JWT to try the console,
        or a Student JWT to try scanning.
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="eyJhbGciOi..."
        rows={5}
      />
      <div className="dev-login__actions">
        <button className="btn btn-primary" onClick={save}>
          Save token
        </button>
      </div>

      {token && (
        <div className="dev-login__current">
          <p>
            Current role: <strong>{role || 'unknown'}</strong>
          </p>
          <div className="dev-login__actions">
            <button className="btn" onClick={() => navigate('/admin')}>
              Go to Gate Console
            </button>
            <button className="btn" onClick={() => navigate('/scan')}>
              Go to Scan Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
