import { apiSlice } from './api';
import { ResearchProject, PaginatedResponse, ApiResponse } from '@types';

interface CreateResearchData {
  title: string;
  description: string;
  field: string;
  collaborators?: string[];
  status: 'ongoing' | 'completed' | 'published';
  startDate: string;
  endDate?: string;
  funding?: string;
  tags: string[];
}

const uiToBackendStatus = (status?: string) => {
  if (status === 'completed') return 'completed';
  if (status === 'published') return 'completed';
  return 'active';
};

const backendToUiStatus = (status?: string): ResearchProject['status'] => {
  if (status === 'completed') return 'completed';
  if (status === 'on_hold') return 'ongoing';
  if (status === 'planning' || status === 'active') return 'ongoing';
  return (status as ResearchProject['status']) || 'ongoing';
};

const normalizeResearchProject = (raw: any): ResearchProject => {
  const projectId = raw?._id || raw?.id || '';
  const collaboratorIds = Array.isArray(raw?.collaborators) ? raw.collaborators : [];
  const tags = Array.isArray(raw?.tags) ? raw.tags : [];
  const leadResearcherId = raw?.leadResearcherId || '';

  return {
    _id: projectId,
    id: projectId,
    title: raw?.title || '',
    description: raw?.description || raw?.abstract || '',
    abstract: raw?.abstract,
    field: raw?.field || tags[0] || 'General',
    leadResearcherId,
    leadResearcher: raw?.leadResearcher || {
      _id: leadResearcherId,
      id: leadResearcherId,
      firstName: 'Lead',
      lastName: 'Researcher',
      role: 'faculty',
    },
    collaborators: collaboratorIds.map((id: string) => ({
      _id: id,
      id,
      firstName: 'Collaborator',
      lastName: id.slice(0, 6),
      role: 'faculty',
    })),
    documents: Array.isArray(raw?.documents) ? raw.documents : [],
    status: backendToUiStatus(raw?.status),
    startDate: raw?.startDate,
    endDate: raw?.endDate,
    tags,
    visibility: raw?.visibility,
    createdAt: raw?.createdAt,
  };
};

const toPaginatedProjects = (response: any): PaginatedResponse<ResearchProject> => {
  const items = Array.isArray(response?.data) ? response.data : [];
  const page = Number(response?.meta?.page || 1);
  const limit = Number(response?.meta?.limit || items.length || 10);
  const total = Number(response?.meta?.total || items.length || 0);
  const totalPages = Number(response?.meta?.totalPages || 1);

  return {
    data: items.map(normalizeResearchProject),
    page,
    limit,
    total,
    hasMore: page < totalPages,
  };
};

export const researchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResearchProjects: builder.query<
      PaginatedResponse<ResearchProject>,
      { page?: number; limit?: number; field?: string; status?: string }
    >({
      query: ({ page = 1, limit = 10, field, status }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (field) params.append('tag', field);
        if (status) params.append('status', uiToBackendStatus(status));
        return `/research?${params.toString()}`;
      },
      transformResponse: (response: any) => toPaginatedProjects(response),
      providesTags: ['Research'],
    }),
    getResearchById: builder.query<ApiResponse<ResearchProject>, string>({
      query: (id) => `/research/${id}`,
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeResearchProject(response?.data?.project || response?.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Research', id }],
    }),
    getMyResearch: builder.query<PaginatedResponse<ResearchProject>, { page?: number; limit?: number }>({
      // leadResearcher=me → backend filters by x-user-id as lead researcher
      query: ({ page = 1, limit = 10 }) => `/research?page=${page}&limit=${limit}&leadResearcher=me`,
      transformResponse: (response: any) => toPaginatedProjects(response),
      providesTags: ['Research'],
    }),
    getCollaboratingResearch: builder.query<PaginatedResponse<ResearchProject>, { page?: number; limit?: number }>({
      // collaborator=me → backend filters by x-user-id in collaborators array
      query: ({ page = 1, limit = 10 }) => `/research?page=${page}&limit=${limit}&collaborator=me`,
      transformResponse: (response: any) => toPaginatedProjects(response),
      providesTags: ['Research'],
    }),
    createResearch: builder.mutation<ApiResponse<ResearchProject>, CreateResearchData>({
      query: (data) => ({
        url: '/research',
        method: 'POST',
        body: {
          title: data.title,
          abstract: data.description,
          description: data.description,
          status: uiToBackendStatus(data.status),
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          collaborators: data.collaborators || [],
          tags: [data.field, ...(data.tags || [])].filter(Boolean),
          visibility: 'department',
        },
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeResearchProject(response?.data?.project || response?.data),
      }),
      invalidatesTags: ['Research'],
    }),
    updateResearch: builder.mutation<ApiResponse<ResearchProject>, { id: string; data: Partial<CreateResearchData> }>({
      query: ({ id, data }) => ({
        url: `/research/${id}`,
        method: 'PUT',
        body: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.description ? { abstract: data.description, description: data.description } : {}),
          ...(data.status ? { status: uiToBackendStatus(data.status) } : {}),
          ...(data.startDate ? { startDate: data.startDate } : {}),
          ...(data.endDate ? { endDate: data.endDate } : {}),
          ...(data.collaborators ? { collaborators: data.collaborators } : {}),
          ...(data.tags || data.field
            ? { tags: [data.field, ...(data.tags || [])].filter(Boolean) }
            : {}),
        },
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeResearchProject(response?.data?.project || response?.data),
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Research', id }],
    }),
    deleteResearch: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/research/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Research'],
    }),
    collaborateResearch: builder.mutation<ApiResponse<ResearchProject>, string>({
      query: (id) => ({
        url: `/research/${id}/collaborate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Research', id }],
    }),
    leaveResearch: builder.mutation<ApiResponse<ResearchProject>, string>({
      query: (id) => ({
        url: `/research/${id}/collaborate`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Research', id }],
    }),
    uploadDocument: builder.mutation<ApiResponse<ResearchProject>, { researchId: string; file: File }>({
      query: ({ researchId, file }) => {
        const formData = new FormData();
        formData.append('document', file);
        return {
          url: `/research/${researchId}/documents`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { researchId }) => [{ type: 'Research', id: researchId }],
    }),
    deleteDocument: builder.mutation<ApiResponse<ResearchProject>, { researchId: string; documentId: string }>({
      query: ({ researchId, documentId }) => ({
        url: `/research/${researchId}/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { researchId }) => [{ type: 'Research', id: researchId }],
    }),
  }),
});

export const {
  useGetResearchProjectsQuery,
  useGetResearchByIdQuery,
  useGetMyResearchQuery,
  useGetCollaboratingResearchQuery,
  useCreateResearchMutation,
  useUpdateResearchMutation,
  useDeleteResearchMutation,
  useCollaborateResearchMutation,
  useLeaveResearchMutation,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} = researchApi;
