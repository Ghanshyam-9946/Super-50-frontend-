import axios from 'axios';

// The platform Super Admin's own API client. Separate from `api` on purpose:
// a different token (platform_token), and signing out of the platform must
// never sign anybody out of an institute, or the other way round.
const base = (import.meta.env.VITE_API_URL || '/api').toString().trim().replace(/\/+$/, '');

const platformApi = axios.create({ baseURL: `${base}/platform`, headers: { 'Content-Type': 'application/json' } });

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('platform_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

platformApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('platform_token');
      localStorage.removeItem('platform_admin');
      if (window.location.pathname !== '/platform/login') window.location.href = '/platform/login';
    }
    return Promise.reject(error);
  }
);

export default platformApi;
