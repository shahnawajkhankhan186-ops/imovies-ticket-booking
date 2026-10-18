import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.error || error.message || 'Something went wrong',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      details: error.response?.data?.details,
    };
    return Promise.reject(customError);
  }
);

export default api;
