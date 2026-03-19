import { apiSlice } from './api';
import { User, LoginCredentials, RegisterData, ApiResponse } from '@types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<ApiResponse<AuthResponse>, RegisterData>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    forgotPassword: builder.mutation<ApiResponse<void>, { email: string }>({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<ApiResponse<void>, { token: string; password: string }>({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    verifyEmail: builder.mutation<ApiResponse<void>, { token: string }>({
      query: (data) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: data,
      }),
    }),
    getMe: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    refreshToken: builder.mutation<ApiResponse<{ accessToken: string; refreshToken: string }>, { refreshToken: string }>({
      query: (data) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation<ApiResponse<void>, { refreshToken: string }>({
      query: (data) => ({
        url: '/auth/logout',
        method: 'POST',
        body: data,
      }),
    }),
    updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
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
    uploadAvatar: builder.mutation<ApiResponse<{ url: string }>, FormData>({
      queryFn: async (formData) => {
        const avatar = formData.get('avatar');
        const localUrl = avatar instanceof File ? URL.createObjectURL(avatar) : '';

        return {
          data: {
            success: true,
            message: 'Avatar preview updated locally',
            data: { url: localUrl },
          },
        };
      },
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} = authApi;
