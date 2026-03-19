import { apiSlice } from './api';
import { Notification, PaginatedResponse, ApiResponse } from '@types';

const buildNotificationTitle = (raw: any): string => {
  // Reject titles that contain literal "null" or are empty
  const rawTitle = raw?.title;
  if (rawTitle && typeof rawTitle === 'string' && !rawTitle.includes('null') && rawTitle.trim()) {
    return rawTitle;
  }

  const data = raw?.data || {};
  const fromName =
    data?.fromUserName ||
    data?.fromName ||
    data?.userName ||
    data?.senderName ||
    (data?.fromUserId ? null : null); // ID alone is useless as a name

  switch (raw?.type) {
    case 'connection': {
      const action = data?.action || data?.status || 'request';
      if (action === 'accepted') return fromName ? `${fromName} accepted your connection request` : 'Your connection request was accepted';
      return fromName ? `${fromName} sent you a connection request` : 'New connection request';
    }
    case 'like':
      return fromName ? `${fromName} liked your post` : 'Someone liked your post';
    case 'comment':
      return fromName ? `${fromName} commented on your post` : 'New comment on your post';
    case 'share':
      return fromName ? `${fromName} shared your post` : 'Your post was shared';
    case 'message':
      return fromName ? `New message from ${fromName}` : 'You have a new message';
    case 'mention':
      return fromName ? `${fromName} mentioned you in a post` : 'You were mentioned in a post';
    case 'job':
      return data?.jobTitle ? `New job: ${data.jobTitle}` : 'New job opportunity available';
    case 'event':
      return data?.eventTitle ? `New event: ${data.eventTitle}` : 'New event announcement';
    case 'research':
      return 'New research paper published';
    default:
      return raw?.message || raw?.body || 'New notification';
  }
};

const normalizeNotification = (raw: any): Notification => {
  const notificationId = raw?._id || raw?.id || '';

  return {
    _id: notificationId,
    id: notificationId,
    userId: raw?.userId,
    type: raw?.type || 'system',
    title: buildNotificationTitle(raw),
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
