import { api } from './api';
import { ResearchProject, PaginatedResponse, PaginationParams } from '../types';
import { extractData, mapUser, toPaginated } from './utils';

const toUiStatus = (status?: string): ResearchProject['status'] => {
  if (status === 'completed') return 'completed';
  if (status === 'planning') return 'proposed';
  return 'ongoing';
};

const mapProject = (raw: any): ResearchProject => {
  const id = raw?._id || raw?.id || '';
  const collaboratorIds = Array.isArray(raw?.collaborators) ? raw.collaborators : [];
  const leadId = raw?.leadResearcherId || '';
  const tags = Array.isArray(raw?.tags) ? raw.tags : [];

  return {
    id,
    title: raw?.title || '',
    description: raw?.description || '',
    abstract: raw?.abstract || raw?.description || '',
    field: raw?.field || tags[0] || 'General',
    status: toUiStatus(raw?.status),
    leadResearcher: mapUser({
      id: leadId,
      firstName: 'Lead',
      lastName: 'Researcher',
      department: raw?.department,
    }),
    collaborators: collaboratorIds.map((collabId: string) =>
      mapUser({ id: collabId, firstName: 'Collaborator', lastName: '' })
    ),
    publications: Array.isArray(raw?.publications) ? raw.publications : [],
    startDate: raw?.startDate || new Date().toISOString(),
    endDate: raw?.endDate,
    tags,
    isCollaborator: collaboratorIds.includes(leadId),
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
  };
};

export const researchService = {
  getProjects: async (params: PaginationParams & { filters?: any } = {}): Promise<PaginatedResponse<ResearchProject>> => {
    const { page = 1, limit = 10, filters = {} } = params;
    const response = await api.get('/research', {
      params: { page, limit, ...filters },
    });
    return toPaginated<ResearchProject>(response, mapProject);
  },

  getProjectById: async (projectId: string): Promise<ResearchProject> => {
    const response = await api.get(`/research/${projectId}`);
    const data = extractData<any>(response);
    return mapProject(data.project || data);
  },

  createProject: async (projectData: Partial<ResearchProject>): Promise<ResearchProject> => {
    const response = await api.post('/research', projectData);
    const data = extractData<any>(response);
    return mapProject(data.project || data);
  },

  updateProject: async (projectId: string, data: Partial<ResearchProject>): Promise<ResearchProject> => {
    const response = await api.put(`/research/${projectId}`, data);
    const payload = extractData<any>(response);
    return mapProject(payload.project || payload);
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/research/${projectId}`);
  },

  joinProject: async (projectId: string): Promise<{ collaborators: ResearchProject['collaborators'] }> => {
    const response = await api.post(`/research/${projectId}/collaborate`);
    const data = extractData<any>(response);
    const project = mapProject(data.project || data);
    return { collaborators: project.collaborators };
  },

  leaveProject: async (projectId: string): Promise<void> => {
    await api.delete(`/research/${projectId}/collaborate`);
  },

  getMyProjects: async (): Promise<ResearchProject[]> => {
    const response = await api.get('/research', {
      params: { page: 1, limit: 50 },
    });
    const paginated = toPaginated<ResearchProject>(response, mapProject);
    return paginated.data;
  },

  addPublication: async (
    projectId: string,
    publicationData: { title: string; journal?: string; conference?: string; year: number; doi?: string; url?: string }
  ): Promise<ResearchProject['publications'][0]> => {
    await Promise.resolve(projectId);
    return {
      id: Date.now().toString(),
      title: publicationData.title,
      journal: publicationData.journal,
      conference: publicationData.conference,
      year: publicationData.year,
      doi: publicationData.doi,
      url: publicationData.url,
    };
  },

  removePublication: async (projectId: string, publicationId: string): Promise<void> => {
    await Promise.resolve({ projectId, publicationId });
  },

  addCollaborator: async (projectId: string, userId: string): Promise<void> => {
    await Promise.resolve(userId);
    await api.post(`/research/${projectId}/collaborate`);
  },

  removeCollaborator: async (projectId: string, userId: string): Promise<void> => {
    await Promise.resolve(userId);
    await api.delete(`/research/${projectId}/collaborate`);
  },
};
