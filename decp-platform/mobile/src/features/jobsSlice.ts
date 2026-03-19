import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Job, JobApplication, PaginatedResponse, PaginationParams } from '../types';
import { jobsService } from '../services/jobsService';

interface JobsState {
  jobs: Job[];
  currentJob: Job | null;
  applications: JobApplication[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
  filters: {
    type?: string;
    location?: string;
    search?: string;
  };
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  applications: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  total: 0,
  filters: {},
};

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params: PaginationParams & { filters?: any } = {}, { rejectWithValue }) => {
    try {
      const response = await jobsService.getJobs(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchMoreJobs = createAsyncThunk(
  'jobs/fetchMoreJobs',
  async (params: PaginationParams & { filters?: any } = {}, { rejectWithValue }) => {
    try {
      const response = await jobsService.getJobs(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch more jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await jobsService.getJobById(jobId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: Partial<Job>, { rejectWithValue }) => {
    try {
      const response = await jobsService.createJob(jobData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, data }: { jobId: string; data: Partial<Job> }, { rejectWithValue }) => {
    try {
      const response = await jobsService.updateJob(jobId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update job');
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      await jobsService.deleteJob(jobId);
      return jobId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete job');
    }
  }
);

export const applyToJob = createAsyncThunk(
  'jobs/applyToJob',
  async ({ jobId, application }: { jobId: string; application: Partial<JobApplication> }, { rejectWithValue }) => {
    try {
      const response = await jobsService.applyToJob(jobId, application);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply to job');
    }
  }
);

export const fetchMyApplications = createAsyncThunk(
  'jobs/fetchMyApplications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await jobsService.getMyApplications();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    setFilters: (state, action: PayloadAction<Partial<JobsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
      state.jobs = [];
    },
    clearFilters: (state) => {
      state.filters = {};
      state.page = 1;
      state.jobs = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<PaginatedResponse<Job>>) => {
        state.isLoading = false;
        state.jobs = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMoreJobs.pending, (state) => {
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreJobs.fulfilled, (state, action: PayloadAction<PaginatedResponse<Job>>) => {
        state.isLoadingMore = false;
        state.jobs = [...state.jobs, ...action.payload.data];
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchMoreJobs.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action: PayloadAction<Job>) => {
        state.isLoading = false;
        state.currentJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action: PayloadAction<Job>) => {
        state.isLoading = false;
        state.jobs = [action.payload, ...state.jobs];
        state.total += 1;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateJob.fulfilled, (state, action: PayloadAction<Job>) => {
        const index = state.jobs.findIndex((j) => j.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(deleteJob.fulfilled, (state, action: PayloadAction<string>) => {
        state.jobs = state.jobs.filter((j) => j.id !== action.payload);
        state.total -= 1;
        if (state.currentJob?.id === action.payload) {
          state.currentJob = null;
        }
      })
      .addCase(applyToJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyToJob.fulfilled, (state, action: PayloadAction<JobApplication>) => {
        state.isLoading = false;
        state.applications.push(action.payload);
        if (state.currentJob) {
          state.currentJob.hasApplied = true;
          state.currentJob.applicants.push(action.payload.id);
        }
      })
      .addCase(applyToJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action: PayloadAction<JobApplication[]>) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentJob, setFilters, clearFilters } = jobsSlice.actions;
export default jobsSlice.reducer;
