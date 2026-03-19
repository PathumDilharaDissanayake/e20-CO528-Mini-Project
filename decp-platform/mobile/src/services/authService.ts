import { api } from './api';
import { LoginCredentials, RegisterCredentials, User } from '../types';
import { extractData, mapUser } from './utils';

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    const data = extractData<any>(response);
    return {
      user: mapUser(data.user),
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', credentials);
    const data = extractData<any>(response);
    return {
      user: mapUser(data.user),
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await api.post('/auth/refresh', {
      refreshToken,
    });
    const data = extractData<any>(response);
    return {
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    const data = extractData<any>(response);
    return mapUser(data.profile || data);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/users/me', data);
    const payload = extractData<any>(response);
    return mapUser(payload.profile || payload);
  },

  changePassword: async (_oldPassword: string, _newPassword: string): Promise<void> => {
    await Promise.resolve();
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
  },
};
