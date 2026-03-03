import { api } from './api';
import { DashboardStats, UserGrowthData, EngagementData } from '../types';
import { extractData } from './utils';

export const analyticsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/analytics/dashboard');
    const data = extractData<any>(response);

    return {
      totalUsers: Number(data?.uniqueUsers || 0),
      activeUsers: Number(data?.uniqueUsers || 0),
      newUsersThisMonth: 0,
      totalPosts: Number(
        (data?.activitiesByType || []).find((item: any) => item.entityType === 'post')?.count || 0
      ),
      totalJobs: Number(
        (data?.activitiesByType || []).find((item: any) => item.entityType === 'job')?.count || 0
      ),
      totalEvents: Number(
        (data?.activitiesByType || []).find((item: any) => item.entityType === 'event')?.count || 0
      ),
      engagementRate: Number(data?.totalActivities || 0),
    };
  },

  getUserGrowth: async (period: 'week' | 'month' | 'year' = 'month'): Promise<UserGrowthData> => {
    const response = await api.get('/analytics/dashboard', {
      params: { period },
    });
    const data = extractData<any>(response);
    const items = Array.isArray(data?.activitiesByDay) ? data.activitiesByDay : [];
    return {
      labels: items.map((item: any) => new Date(item.date).toLocaleDateString()),
      data: items.map((item: any) => Number(item.count || 0)),
    };
  },

  getEngagementStats: async (period: 'week' | 'month' | 'year' = 'month'): Promise<EngagementData> => {
    const response = await api.get('/analytics/dashboard', {
      params: { period },
    });
    const data = extractData<any>(response);
    const items = Array.isArray(data?.activitiesByDay) ? data.activitiesByDay : [];
    return {
      labels: items.map((item: any) => new Date(item.date).toLocaleDateString()),
      posts: items.map((item: any) => Number(item.count || 0)),
      likes: items.map(() => 0),
      comments: items.map(() => 0),
    };
  },

  getTopPosts: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get('/analytics/popular', {
      params: { entityType: 'post', limit },
    });
    const data = extractData<any>(response);
    return Array.isArray(data?.popularContent) ? data.popularContent : [];
  },

  getTopJobs: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get('/analytics/popular', {
      params: { entityType: 'job', limit },
    });
    const data = extractData<any>(response);
    return Array.isArray(data?.popularContent) ? data.popularContent : [];
  },

  getDepartmentStats: async (): Promise<any[]> => {
    return [];
  },

  getUserActivityReport: async (startDate: string, endDate: string): Promise<any> => {
    const response = await api.get('/analytics/dashboard', {
      params: { startDate, endDate },
    });
    return extractData<any>(response);
  },
};
