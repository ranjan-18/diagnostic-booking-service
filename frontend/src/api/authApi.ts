import { apiClient } from './client';
import { LoginResponse, SignupRequest, User } from '../types';

export const authApi = {
  signup: async (payload: SignupRequest): Promise<User> => {
    const { data } = await apiClient.post<User>('/api/auth/signup/', payload);
    return data;
  },

  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/api/auth/login/', {
      username,
      password,
    });
    return data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const { data } = await apiClient.post<{ access: string }>('/api/auth/token/refresh/', {
      refresh,
    });
    return data;
  },
};
