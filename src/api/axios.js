import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', 
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