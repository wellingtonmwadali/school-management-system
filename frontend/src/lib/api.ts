import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

console.log('🌐 API Configuration:');
console.log('  Base URL:', API_URL);
console.log('  Environment:', process.env.NODE_ENV);

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
  console.log('  Full URL:', `${config.baseURL || ''}${config.url || ''}`);
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('  🔑 Token attached');
    } else {
      console.log('  ⚠️ No token found in localStorage');
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    console.log('  Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    console.error('  URL:', error.config?.url);
    console.error('  Status:', error.response?.status);
    console.error('  Response:', error.response?.data);
    
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.warn('🚪 Unauthorized - Redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
