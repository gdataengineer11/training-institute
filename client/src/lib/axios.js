import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tims_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('tims_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
