import axios from 'axios';

// Mirrors services/api.js's baseURL resolution exactly — a relative '/api'
// only reaches the backend in local dev (via vite.config.js's proxy);
// vercel.json has no equivalent /api rewrite in production, only an SPA
// catch-all, so a relative baseURL there would route every PMS request
// back into index.html instead of the real backend origin.
const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const cleanBaseURL = rawApiUrl
  .toString()
  .replace(/[‐-―−－]/g, '-')
  .replace(/[^\x20-\x7E]/g, '')
  .trim()
  .replace(/\/+$/, '');

const api = axios.create({
  baseURL: cleanBaseURL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT the app's real login flow actually stores. PMS shares one
// login/auth system with the rest of the app (authSlice.js's `login` thunk
// — there's no separate `/pms/auth/login` in use, that route file exists
// but isn't mounted in app.js) — the token lives under 'super50_token', not
// 'token'. Using the wrong key here meant every PMS request went out with
// no Authorization header and no auth cookie either (login never sets one),
// so every protected PMS endpoint 401'd silently — this was the actual
// root cause behind most of "nothing in PMS loads/works right".
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('super50_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear and redirect (mirrors authSlice.js's own keys)
      localStorage.removeItem('super50_token');
      localStorage.removeItem('super50_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const handleError = (err) => {
  return err.response?.data?.message || err.message || 'Something went wrong';
};
