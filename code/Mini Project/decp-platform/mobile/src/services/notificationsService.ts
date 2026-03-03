import { api } from './api';
import { Notification, PaginatedResponse, PaginationParams } from '../types';
import { toPaginated } from './utils';

const mapNotification = (raw: any): Notification => ({
  id: raw?._id || raw?.id || '',
  userId: raw?.userId || '',
  type: raw?.type || 'mention',
  title: raw?.title || 'Notification',
  body: raw?.body || '',
  data: raw?.data,
  isRead: Boolean(raw?.isRead),
  createdAt: raw?.createdAt || new Date().toISOString(),
});

export const notificationsService = {
  getNotifications: async (params: PaginationParams = {}): Promise<PaginatedResponse<Notification>> => {
    const { page = 1, limit = 20 } = params;
    const response = await api.get('/notifications', {
      params: { page, limit },
    });
    return toPaginated<Notification>(response, mapNotification);
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  clearAll: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications', {
      params: { unreadOnly: true, limit: 1 },
    });
    const count = Number(response.data?.meta?.total || 0);
    return { count };
  },

  updatePushToken: async (token: string): Promise<void> => {
    await Promise.resolve(token);
  },

  removePushToken: async (): Promise<void> => {
    await Promise.resolve();
  },
};
