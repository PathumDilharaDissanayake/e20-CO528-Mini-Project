import { apiSlice } from './api';
import { Job, JobApplication, PaginatedResponse, ApiResponse } from '@types';

interface CreateJobData {
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline?: string;
}

interface ApplyJobData {
  jobId: string;
  resumeUrl?: string;
  coverLetter?: string;
}

const normalizeJob = (raw: any): Job => {
  const jobId = raw?._id || raw?.id || '';

  return {
    _id: jobId,
    id: jobId,
    title: raw?.title || '',
    company: raw?.company || 'Unknown Company',
    location: raw?.location || 'Not specified',
    type: raw?.type || 'full-time',
    description: raw?.description || '',
    requirements: raw?.requirements || [],
    skills: raw?.skills || [],
    salary: raw?.salary,
    postedBy: raw?.postedBy,
    applications: raw?.applications || [],
    deadline: raw?.deadline,
    expiresAt: raw?.expiresAt,
    createdAt: raw?.createdAt,
    isActive: raw?.status ? raw.status === 'active' : raw?.isActive,
    status: raw?.status,
  };
};

const toPaginatedJobs = (response: any): PaginatedResponse<Job> => {
  const items = Array.isArray(response?.data) ? response.data : [];
  const page = Number(response?.meta?.page || 1);
  const limit = Number(response?.meta?.limit || items.length || 10);
  const total = Number(response?.meta?.total || items.length || 0);
  const totalPages = Number(response?.meta?.totalPages || 1);

  return {
    data: items.map(normalizeJob),
    page,
    limit,
    total,
    hasMore: page < totalPages,
  };
};

export const jobApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<
      PaginatedResponse<Job>,
      { page?: number; limit?: number; type?: string; location?: string; search?: string }
    >({
      query: ({ page = 1, limit = 10, type, location, search }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (type) params.append('type', type);
        if (location) params.append('location', location);
        if (search) params.append('q', search);
        return `/jobs?${params.toString()}`;
      },
      transformResponse: (response: any) => toPaginatedJobs(response),
      providesTags: ['Job'],
    }),
    getJobById: builder.query<ApiResponse<Job>, string>({
      query: (id) => `/jobs/${id}`,
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeJob(response?.data?.job || response?.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),
    getMyJobs: builder.query<PaginatedResponse<Job>, { page?: number; limit?: number }>({
      // postedBy=me causes the backend to filter by x-user-id header
      query: ({ page = 1, limit = 10 }) => `/jobs?page=${page}&limit=${limit}&postedBy=me`,
      transformResponse: (response: any) => toPaginatedJobs(response),
      providesTags: ['Job'],
    }),
    getAppliedJobs: builder.query<PaginatedResponse<Job>, { page?: number; limit?: number }>({
      query: () => `/jobs/applications`,
      transformResponse: (response: any) => {
        const applications = Array.isArray(response?.data?.applications) ? response.data.applications : [];
        const jobs = applications
          .map((app: any) => app?.Job || app?.job)
          .filter(Boolean)
          .map(normalizeJob);

        return {
          data: jobs,
          page: 1,
          limit: jobs.length || 10,
          total: jobs.length,
          hasMore: false,
        };
      },
      providesTags: ['Job'],
    }),
    createJob: builder.mutation<ApiResponse<Job>, CreateJobData>({
      query: (data) => ({
        url: '/jobs',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeJob(response?.data?.job || response?.data),
      }),
      invalidatesTags: ['Job'],
    }),
    updateJob: builder.mutation<ApiResponse<Job>, { id: string; data: Partial<CreateJobData> }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeJob(response?.data?.job || response?.data),
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }],
    }),
    deleteJob: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Job'],
    }),
    applyForJob: builder.mutation<ApiResponse<JobApplication>, ApplyJobData>({
      query: ({ jobId, ...data }) => ({
        url: `/jobs/${jobId}/apply`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Job'],
    }),
    updateApplicationStatus: builder.mutation<
      ApiResponse<JobApplication>,
      { jobId: string; applicationId: string; status: string }
    >({
      query: ({ applicationId, status }) => ({
        url: `/jobs/applications/${applicationId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useGetMyJobsQuery,
  useGetAppliedJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useApplyForJobMutation,
  useUpdateApplicationStatusMutation,
} = jobApi;
