import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { ApiErrorResponse } from '../types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling & token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and refresh token exists and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const { data } = await axios.post<{ access: string }>(
            `${API_BASE_URL}/api/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          localStorage.setItem('access_token', data.access);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
          }
          return apiClient(originalRequest);
        } catch {
          // Refresh failed — clear tokens & redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export const parseApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.message) {
      const details = data.error.details;
      if (details && typeof details === 'object') {
        const detailMsgs = Object.entries(details)
          .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        return `${data.error.message} (${detailMsgs})`;
      }
      return data.error.message;
    }
    if (error.response?.status === 404) return 'Resource not found.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 409) return (error.response.data as any)?.detail || 'Conflict with the current resource state.';
    if (error.message) return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
