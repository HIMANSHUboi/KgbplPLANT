import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Helper: extract a human-readable error string from any response data shape
const normalizeErrorData = (data) => {
  if (!data) return 'Something went wrong';
  if (typeof data === 'string') return data;

  // Backend format: { error: 'string' }
  if (typeof data.error === 'string') return data.error;

  // Backend format: { error: { message: '...' } } (Prisma / nested)
  if (data.error && typeof data.error === 'object') {
    return data.error.message || JSON.stringify(data.error);
  }

  // Vercel / proxy error format: { code: '...', message: '...' }
  if (data.message && typeof data.message === 'string') return data.message;

  // Last resort
  return JSON.stringify(data);
};

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Normalize the response data so every catch handler receives a plain string
    if (err.response?.data) {
      const d = err.response.data;
      // If error field is an object, flatten it to a string
      if (d.error && typeof d.error === 'object') {
        d.error = d.error.message || JSON.stringify(d.error);
      }
      // If the whole payload is an object without an 'error' key (e.g. Vercel {code, message})
      if (typeof d === 'object' && !d.error && (d.code || d.message)) {
        err.response.data = { error: d.message || d.code || 'Request failed' };
      }
    }

    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('token', data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;