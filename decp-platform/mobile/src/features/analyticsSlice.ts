import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardStats, UserGrowthData, EngagementData } from '../types';
import { analyticsService } from '../services/analyticsService';

interface AnalyticsState {
  stats: DashboardStats | null;
  userGrowth: UserGrowthData | null;
  engagement: EngagementData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  stats: null,
  userGrowth: null,
  engagement: null,
  isLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'analytics/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboardStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchUserGrowth = createAsyncThunk(
  'analytics/fetchUserGrowth',
  async (period: 'week' | 'month' | 'year' = 'month', { rejectWithValue }) => {
    try {
      const response = await analyticsService.getUserGrowth(period);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user growth');
    }
  }
);

export const fetchEngagementStats = createAsyncThunk(
  'analytics/fetchEngagementStats',
  async (period: 'week' | 'month' | 'year' = 'month', { rejectWithValue }) => {
    try {
      const response = await analyticsService.getEngagementStats(period);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch engagement stats');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAnalytics: (state) => {
      state.stats = null;
      state.userGrowth = null;
      state.engagement = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserGrowth.fulfilled, (state, action: PayloadAction<UserGrowthData>) => {
        state.userGrowth = action.payload;
      })
      .addCase(fetchEngagementStats.fulfilled, (state, action: PayloadAction<EngagementData>) => {
        state.engagement = action.payload;
      });
  },
});

export const { clearError, clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
