import { api } from './api';
import { User, UserProfile, Post, PaginatedResponse, PaginationParams } from '../types';
import { extractData, mapUser } from './utils';
import { feedService } from './feedService';

const mapProfile = (raw: any): UserProfile => {
  const user = mapUser(raw);
  return {
    ...user,
    postsCount: Number(raw?.postsCount || 0),
    connectionsCount: Number(raw?.connectionsCount || (Array.isArray(raw?.connections) ? raw.connections.length : 0)),
    isConnected: Boolean(raw?.isConnected),
    hasPendingRequest: Boolean(raw?.hasPendingRequest),
  };
};

export const profileService = {
  getProfile: async (userId?: string): Promise<UserProfile> => {
    const url = userId ? `/users/${userId}` : '/users/me';
    const response = await api.get(url);
    const data = extractData<any>(response);
    return mapProfile(data.profile || data);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/users/me', data);
    const payload = extractData<any>(response);
    return mapUser(payload.profile || payload);
  },

  uploadAvatar: async (imageUri: string): Promise<{ avatar: string }> => {
    await Promise.resolve();
    return { avatar: imageUri };
  },

  getUserPosts: async (userId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Post>> => {
    return feedService.getUserPosts(userId, params);
  },

  getConnections: async (userId: string): Promise<User[]> => {
    await Promise.resolve(userId);
    const response = await api.get('/users/connections', {
      params: { type: 'following' },
    });
    const data = extractData<any>(response);
    const connections = Array.isArray(data?.connections) ? data.connections : [];
    return connections.map((connection: any) =>
      mapUser({
        id: connection?.followingId || connection?.followerId || '',
        firstName: 'Connection',
      })
    );
  },

  getPendingRequests: async (): Promise<User[]> => {
    return [];
  },

  sendConnectionRequest: async (userId: string): Promise<void> => {
    await api.post(`/users/connections/${userId}/follow`);
  },

  acceptConnectionRequest: async (userId: string): Promise<User> => {
    await api.post(`/users/connections/${userId}/follow`);
    const profile = await profileService.getProfile(userId);
    return profile;
  },

  rejectConnectionRequest: async (userId: string): Promise<void> => {
    await Promise.resolve(userId);
  },

  removeConnection: async (userId: string): Promise<void> => {
    await api.delete(`/users/connections/${userId}/unfollow`);
  },

  searchUsers: async (query: string, params: PaginationParams = {}): Promise<PaginatedResponse<User>> => {
    const { page = 1, limit = 10 } = params;
    const response = await api.get('/users/search', {
      params: { q: query, page, limit },
    });
    const data = extractData<any[]>(response);
    const users = Array.isArray(data) ? data : [];
    return {
      data: users.map(mapUser),
      page,
      limit,
      total: users.length,
      hasMore: false,
    };
  },

  getSuggestedConnections: async (): Promise<User[]> => {
    return [];
  },
};
