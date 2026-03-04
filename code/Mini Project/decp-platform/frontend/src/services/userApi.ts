import { apiSlice } from './api';
import { User, PaginatedResponse, ApiResponse } from '@types';

interface ConnectionRequest {
  connectionId: string;
  userId: string;
  requestedAt: string;
  profile: {
    userId: string;
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
    avatar?: string;
    headline?: string;
  };
}

const normalizeUser = (raw: any): User => {
  // For user-service profiles: userId is the auth user ID; id is the profile's own UUID
  const userId = raw?._id || raw?.userId || raw?.id || '';
  return {
    _id: userId,
    id: userId,
    email: raw?.email || '',
    firstName: raw?.firstName || '',
    lastName: raw?.lastName || '',
    role: raw?.role || 'student',
    avatar: raw?.avatar || raw?.profilePicture,
    profilePicture: raw?.profilePicture || raw?.avatar,
    bio: raw?.bio,
    headline: raw?.headline,
    department: raw?.department,
    graduationYear: raw?.graduationYear,
    skills: raw?.skills || [],
    connections: raw?.connections || [],
    isEmailVerified: raw?.isEmailVerified,
  };
};

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedResponse<User>, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 20, search }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('q', search);
        return `/users?${params.toString()}`;
      },
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.data) ? response.data : [];
        return {
          data: items.map(normalizeUser),
          page: response?.meta?.page || 1,
          limit: response?.meta?.limit || items.length,
          total: response?.meta?.total || items.length,
          hasMore: (response?.meta?.page || 1) < (response?.meta?.totalPages || 1),
        };
      },
      providesTags: ['User'],
    }),
    getUserById: builder.query<ApiResponse<User>, string>({
      query: (userId) => `/users/${userId}`,
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeUser(response?.data?.profile || response?.data?.user || response?.data),
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    getMyProfile: builder.query<ApiResponse<User>, void>({
      query: () => '/users/me',
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeUser(response?.data?.profile || response?.data?.user || response?.data),
      }),
      providesTags: ['User'],
    }),
    searchUsers: builder.query<PaginatedResponse<User>, { q: string; page?: number }>({
      query: ({ q, page = 1 }) => `/users/search?q=${encodeURIComponent(q)}&page=${page}`,
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.data) ? response.data : [];
        return {
          data: items.map(normalizeUser),
          page: response?.meta?.page || 1,
          limit: response?.meta?.limit || items.length,
          total: response?.meta?.total || items.length,
          hasMore: false,
        };
      },
      providesTags: ['User'],
    }),
    followUser: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/users/connections/${userId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }, 'User'],
    }),
    sendConnectionRequest: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/users/connections/${userId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }, 'User'],
    }),
    unfollowUser: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/users/connections/${userId}/unfollow`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    acceptConnection: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/users/connections/${userId}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }, 'User'],
    }),
    declineConnection: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/users/connections/${userId}/decline`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }, 'User'],
    }),
    getConnections: builder.query<{ total: number }, void>({
      query: () => '/users/connections',
      transformResponse: (response: any) => ({
        total: response?.meta?.total ?? (response?.data?.connections?.length || 0),
      }),
      providesTags: ['User'],
    }),
    getConnectionRequests: builder.query<{ data: ConnectionRequest[]; total: number }, void>({
      query: () => '/users/connections/requests',
      transformResponse: (response: any) => ({
        data: response?.data || [],
        total: response?.total || 0,
      }),
      providesTags: ['User'],
    }),
    getConnectionStatus: builder.query<any, string>({
      query: (userId) => `/users/connections/${userId}/status`,
      transformResponse: (response: any) => response,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    endorseSkill: builder.mutation<any, { userId: string; skill: string }>({
      query: ({ userId, skill }) => ({
        url: `/users/${userId}/endorse`,
        method: 'POST',
        body: { skill },
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }, 'User'],
    }),
    updateMyProfile: builder.mutation<any, Record<string, any>>({
      query: (data) => ({
        url: '/users/me',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: response?.data?.profile || response?.data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetConnectionsQuery,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetMyProfileQuery,
  useSearchUsersQuery,
  useFollowUserMutation,
  useSendConnectionRequestMutation,
  useUnfollowUserMutation,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
  useGetConnectionRequestsQuery,
  useGetConnectionStatusQuery,
  useEndorseSkillMutation,
  useUpdateMyProfileMutation,
} = userApi;
