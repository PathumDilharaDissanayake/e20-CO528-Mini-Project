import { apiSlice } from './api';
import { Analytics, ApiResponse } from '@types';

const loadDashboard = (period: 'week' | 'month' | 'year') => {
  const endDate = new Date();
  const startDate = new Date(endDate);

  if (period === 'week') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(endDate.getMonth() - 1);
  } else {
    startDate.setFullYear(endDate.getFullYear() - 1);
  }

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  return `/analytics/dashboard?${params.toString()}`;
};

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<ApiResponse<Analytics>, { period?: 'week' | 'month' | 'year' }>({
      query: ({ period = 'month' }) => loadDashboard(period),
      transformResponse: (response: any) => ({
        ...response,
        data: response?.data || {},
      }),
      providesTags: ['Analytics'],
    }),
    getActiveUsers: builder.query<ApiResponse<{ date: string; count: number }[]>, { period?: 'week' | 'month' | 'year' }>({
      query: ({ period = 'month' }) => loadDashboard(period),
      transformResponse: (response: any) => ({
        success: Boolean(response?.success),
        data: (response?.data?.activitiesByDay || []).map((row: any) => ({
          date: row?.date,
          count: Number(row?.count || 0),
        })),
      }),
      providesTags: ['Analytics'],
    }),
    getPopularPosts: builder.query<ApiResponse<Analytics['popularPosts']>, void>({
      query: () => '/analytics/popular?entityType=post',
      transformResponse: (response: any) => ({
        success: Boolean(response?.success),
        data: response?.data?.popularContent || [],
      }),
      providesTags: ['Analytics', 'Post'],
    }),
    getJobStats: builder.query<ApiResponse<Analytics['jobStats']>, void>({
      query: () => '/analytics/dashboard',
      transformResponse: (response: any) => {
        const byType = Array.isArray(response?.data?.activitiesByType) ? response.data.activitiesByType : [];
        const jobCount = Number(byType.find((item: any) => item?.entityType === 'job')?.count || 0);

        return {
          success: Boolean(response?.success),
          data: {
            totalJobs: jobCount,
            activeJobs: jobCount,
            totalApplications: 0,
            pendingApplications: 0,
          },
        };
      },
      providesTags: ['Analytics', 'Job'],
    }),
    getEngagementMetrics: builder.query<ApiResponse<Analytics['engagementMetrics']>, { period?: 'week' | 'month' | 'year' }>({
      query: ({ period = 'month' }) => loadDashboard(period),
      transformResponse: (response: any) => {
        const byType = Array.isArray(response?.data?.activitiesByType) ? response.data.activitiesByType : [];

        return {
          success: Boolean(response?.success),
          data: {
            postsCreated: Number(byType.find((item: any) => item?.entityType === 'post')?.count || 0),
            commentsAdded: 0,
            likesGiven: 0,
            eventsCreated: Number(byType.find((item: any) => item?.entityType === 'event')?.count || 0),
            eventsAttended: 0,
          },
        };
      },
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetAnalyticsQuery,
  useGetActiveUsersQuery,
  useGetPopularPostsQuery,
  useGetJobStatsQuery,
  useGetEngagementMetricsQuery,
} = analyticsApi;
