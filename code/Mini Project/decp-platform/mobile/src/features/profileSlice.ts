import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserProfile, Post, PaginatedResponse, PaginationParams } from '../types';
import { profileService } from '../services/profileService';

interface ProfileState {
  profile: UserProfile | null;
  posts: Post[];
  connections: User[];
  pendingRequests: User[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

const initialState: ProfileState = {
  profile: null,
  posts: [],
  connections: [],
  pendingRequests: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId?: string, { rejectWithValue }) => {
    try {
      const response = await profileService.getProfile(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'profile/fetchUserPosts',
  async ({ userId, params }: { userId: string; params?: PaginationParams }, { rejectWithValue }) => {
    try {
      const response = await profileService.getUserPosts(userId, params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user posts');
    }
  }
);

export const fetchMoreUserPosts = createAsyncThunk(
  'profile/fetchMoreUserPosts',
  async ({ userId, params }: { userId: string; params?: PaginationParams }, { rejectWithValue }) => {
    try {
      const response = await profileService.getUserPosts(userId, params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch more user posts');
    }
  }
);

export const fetchConnections = createAsyncThunk(
  'profile/fetchConnections',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await profileService.getConnections(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch connections');
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'profile/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileService.getPendingRequests();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending requests');
    }
  }
);

export const sendConnectionRequest = createAsyncThunk(
  'profile/sendConnectionRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      await profileService.sendConnectionRequest(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send connection request');
    }
  }
);

export const acceptConnectionRequest = createAsyncThunk(
  'profile/acceptConnectionRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await profileService.acceptConnectionRequest(userId);
      return { userId, connection: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept connection request');
    }
  }
);

export const rejectConnectionRequest = createAsyncThunk(
  'profile/rejectConnectionRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      await profileService.rejectConnectionRequest(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject connection request');
    }
  }
);

export const removeConnection = createAsyncThunk(
  'profile/removeConnection',
  async (userId: string, { rejectWithValue }) => {
    try {
      await profileService.removeConnection(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove connection');
    }
  }
);

export const updateProfileData = createAsyncThunk(
  'profile/updateProfileData',
  async (data: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await profileService.updateProfile(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async (imageUri: string, { rejectWithValue }) => {
    try {
      const response = await profileService.uploadAvatar(imageUri);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.posts = [];
      state.connections = [];
      state.pendingRequests = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Post>>) => {
        state.isLoading = false;
        state.posts = action.payload.data;
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMoreUserPosts.pending, (state) => {
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreUserPosts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Post>>) => {
        state.isLoadingMore = false;
        state.posts = [...state.posts, ...action.payload.data];
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchMoreUserPosts.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      .addCase(fetchConnections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConnections.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false;
        state.connections = action.payload;
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPendingRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false;
        state.pendingRequests = action.payload;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action: PayloadAction<string>) => {
        if (state.profile) {
          state.profile.hasPendingRequest = true;
        }
      })
      .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
        const { userId } = action.payload;
        state.pendingRequests = state.pendingRequests.filter((u) => u.id !== userId);
        state.connections.push(action.payload.connection);
        if (state.profile) {
          state.profile.connectionsCount += 1;
        }
      })
      .addCase(rejectConnectionRequest.fulfilled, (state, action: PayloadAction<string>) => {
        state.pendingRequests = state.pendingRequests.filter((u) => u.id !== action.payload);
      })
      .addCase(removeConnection.fulfilled, (state, action: PayloadAction<string>) => {
        state.connections = state.connections.filter((u) => u.id !== action.payload);
        if (state.profile) {
          state.profile.connectionsCount = Math.max(0, state.profile.connectionsCount - 1);
          state.profile.isConnected = false;
        }
      })
      .addCase(updateProfileData.fulfilled, (state, action: PayloadAction<User>) => {
        state.profile = { ...state.profile, ...action.payload } as UserProfile;
      })
      .addCase(uploadAvatar.fulfilled, (state, action: PayloadAction<{ avatar: string }>) => {
        if (state.profile) {
          state.profile.avatar = action.payload.avatar;
        }
      });
  },
});

export const { clearError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
