import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('roadrescue-token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Token Refresh & Global Error Handling
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data; // Return only data
  },
  async (error) => {
    const originalRequest = error.config;

    // Global Error Mapping
    if (!error.response) {
      // Network error or timeout
      return Promise.reject({
        message: 'Server is unreachable. Please check your internet connection.',
        error: 'Network Error',
      });
    }

    const status = error.response.status;
    const data = error.response.data;

    // Handle 401 Unauthorized / Token Expiration
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('roadrescue-refresh-token');
      if (refreshToken) {
        try {
          const res: any = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data && res.data.token) {
            const newToken = res.data.token;
            localStorage.setItem('roadrescue-token', newToken);
            if (res.data.refreshToken) {
              localStorage.setItem('roadrescue-refresh-token', res.data.refreshToken);
            }
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            processQueue(null, newToken);
            isRefreshing = false;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          // Clear session on refresh token failure
          localStorage.removeItem('roadrescue-token');
          localStorage.removeItem('roadrescue-refresh-token');
          localStorage.removeItem('roadrescue_user');
          localStorage.removeItem('loggedIn');
          window.location.href = '/'; // Reset to login
          return Promise.reject({
            message: 'Session expired. Please log in again.',
            error: 'Session Expired',
          });
        }
      }
    }

    // Map other HTTP errors
    const errorPayload = {
      status,
      message: data?.message || error.message || 'Request failed. Please try again.',
      error: data?.error || 'Bad Request',
      validationErrors: data?.errors || null,
    };

    return Promise.reject(errorPayload);
  }
);

export default apiClient;
