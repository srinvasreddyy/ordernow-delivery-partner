import axios from 'axios';
let baseURL = 'http://localhost:3000/api';
// let baseURL = 'https://api.kribud.co.uk/api';

const api = axios.create({
  baseURL: baseURL, 
  withCredentials: true, 
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // FIX: Do not redirect if the 401 comes from the login request itself
    const isLoginRequest = error.config.url.includes('/login');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      // Only redirect if it's NOT a login attempt (e.g., expired session)
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;