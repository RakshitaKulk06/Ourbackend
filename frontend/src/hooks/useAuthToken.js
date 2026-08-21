import { useCallback, useState } from 'react';

function decodeRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

/**
 * Reads/writes the JWT this standalone build uses for testing.
 * On integration, replace with the real app's auth context/hook — this is
 * only here so the module works before it's wired into the main site.
 */
export function useAuthToken() {
  const [token, setTokenState] = useState(() => localStorage.getItem('qwerty_token'));

  const setToken = useCallback((value) => {
    if (value) {
      localStorage.setItem('qwerty_token', value);
    } else {
      localStorage.removeItem('qwerty_token');
    }
    setTokenState(value);
  }, []);

  return { token, role: token ? decodeRole(token) : null, setToken };
}
