import { apiSlice } from './api';
import { User, PaginatedResponse, ApiResponse } from '@types';

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
      invalidatesTags: ['User'],
    }),
    unfollowUser: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/users/connections/${userId}/unfollow`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    getConnectionStatus: builder.query<ApiResponse<{ status: string }>, string>({
      query: (userId) => `/users/connections/${userId}/status`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetMyProfileQuery,
  useSearchUsersQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetConnectionStatusQuery,
} = userApi;
