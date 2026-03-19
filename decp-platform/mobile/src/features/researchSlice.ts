import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ResearchProject, PaginatedResponse, PaginationParams } from '../types';
import { researchService } from '../services/researchService';

interface ResearchState {
  projects: ResearchProject[];
  currentProject: ResearchProject | null;
  myProjects: ResearchProject[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
}

const initialState: ResearchState = {
  projects: [],
  currentProject: null,
  myProjects: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  total: 0,
};

export const fetchProjects = createAsyncThunk(
  'research/fetchProjects',
  async (params: PaginationParams & { filters?: any } = {}, { rejectWithValue }) => {
    try {
      const response = await researchService.getProjects(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const fetchMoreProjects = createAsyncThunk(
  'research/fetchMoreProjects',
  async (params: PaginationParams & { filters?: any } = {}, { rejectWithValue }) => {
    try {
      const response = await researchService.getProjects(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch more projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'research/fetchProjectById',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await researchService.getProjectById(projectId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'research/createProject',
  async (projectData: Partial<ResearchProject>, { rejectWithValue }) => {
    try {
      const response = await researchService.createProject(projectData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'research/updateProject',
  async ({ projectId, data }: { projectId: string; data: Partial<ResearchProject> }, { rejectWithValue }) => {
    try {
      const response = await researchService.updateProject(projectId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'research/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await researchService.deleteProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

export const joinProject = createAsyncThunk(
  'research/joinProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await researchService.joinProject(projectId);
      return { projectId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join project');
    }
  }
);

export const leaveProject = createAsyncThunk(
  'research/leaveProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await researchService.leaveProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave project');
    }
  }
);

export const fetchMyProjects = createAsyncThunk(
  'research/fetchMyProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await researchService.getMyProjects();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my projects');
    }
  }
);

const researchSlice = createSlice({
  name: 'research',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<PaginatedResponse<ResearchProject>>) => {
        state.isLoading = false;
        state.projects = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMoreProjects.pending, (state) => {
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreProjects.fulfilled, (state, action: PayloadAction<PaginatedResponse<ResearchProject>>) => {
        state.isLoadingMore = false;
        state.projects = [...state.projects, ...action.payload.data];
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchMoreProjects.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action: PayloadAction<ResearchProject>) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action: PayloadAction<ResearchProject>) => {
        state.isLoading = false;
        state.projects = [action.payload, ...state.projects];
        state.myProjects = [action.payload, ...state.myProjects];
        state.total += 1;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProject.fulfilled, (state, action: PayloadAction<ResearchProject>) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
        const myIndex = state.myProjects.findIndex((p) => p.id === action.payload.id);
        if (myIndex !== -1) {
          state.myProjects[myIndex] = action.payload;
        }
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        state.myProjects = state.myProjects.filter((p) => p.id !== action.payload);
        state.total -= 1;
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(joinProject.fulfilled, (state, action) => {
        const { projectId, collaborators } = action.payload;
        const project = state.projects.find((p) => p.id === projectId);
        if (project) {
          project.collaborators = collaborators;
          project.isCollaborator = true;
        }
        if (state.currentProject?.id === projectId) {
          state.currentProject.collaborators = collaborators;
          state.currentProject.isCollaborator = true;
        }
      })
      .addCase(leaveProject.fulfilled, (state, action: PayloadAction<string>) => {
        const projectId = action.payload;
        const project = state.projects.find((p) => p.id === projectId);
        if (project) {
          project.isCollaborator = false;
        }
        if (state.currentProject?.id === projectId) {
          state.currentProject.isCollaborator = false;
        }
        state.myProjects = state.myProjects.filter((p) => p.id !== projectId);
      })
      .addCase(fetchMyProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProjects.fulfilled, (state, action: PayloadAction<ResearchProject[]>) => {
        state.isLoading = false;
        state.myProjects = action.payload;
      })
      .addCase(fetchMyProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentProject } = researchSlice.actions;
export default researchSlice.reducer;
