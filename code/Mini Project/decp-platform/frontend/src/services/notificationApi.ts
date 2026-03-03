import { apiSlice } from './api';
import { Notification, PaginatedResponse, ApiResponse } from '@types';

const normalizeNotification = (raw: any): Notification => {
  const notificationId = raw?._id || raw?.id || '';

  return {
    _id: notificationId,
    id: notificationId,
    userId: raw?.userId,
    type: raw?.type || 'system',
    title: raw?.title || 'Notification',
    message: raw?.message || raw?.body || '',
    body: raw?.body || raw?.message || '',
    data: raw?.data,
    isRead: Boolean(raw?.isRead),
    createdAt: raw?.createdAt,
  };
};

const toPaginatedNotifications = (response: any): PaginatedResponse<Notification> => {
  const items = Array.isArray(response?.data) ? response.data : [];
  const page = Number(response?.meta?.page || 1);
  const limit = Number(response?.meta?.limit || items.length || 20);
  const total = Number(response?.meta?.total || items.length || 0);

  return {
    data: items.map(normalizeNotification),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
};

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<Notification>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => `/notifications?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => toPaginatedNotifications(response),
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => '/notifications?unreadOnly=true&limit=1',
      transformResponse: (response: any) => ({
        success: Boolean(response?.success),
        data: {
          count: Number(response?.meta?.total || 0),
        },
        message: response?.message,
      }),
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllAsRead: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
