import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'The server took too long to respond. Please try again.'
        : 'Network error — please check your connection and try again.');

    if (status === 401 && localStorage.getItem('zf_token')) {
      localStorage.removeItem('zf_token');
      localStorage.removeItem('zf_user');
      window.dispatchEvent(new Event('zf:unauthorized'));
    }

    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
