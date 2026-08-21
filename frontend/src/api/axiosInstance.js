import axios from 'axios';

/**
 * INTEGRATION NOTE: this reads the JWT from localStorage under
 * 'qwerty_token'. When this module is merged into the main app, point this
 * at wherever the Authentication Module already stores its token (context,
 * redux store, a different localStorage key, cookies, etc.) instead.
 */
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qwerty_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
