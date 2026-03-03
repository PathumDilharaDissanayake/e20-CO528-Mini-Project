import { api } from './api';
import { Job, JobApplication, PaginatedResponse, PaginationParams } from '../types';
import { extractData, mapUser, toPaginated } from './utils';

const mapJob = (raw: any): Job => {
  const id = raw?._id || raw?.id || '';
  const postedByRaw = raw?.postedBy && typeof raw.postedBy === 'object'
    ? raw.postedBy
    : { id: raw?.postedBy || '', firstName: 'Recruiter', lastName: '' };

  return {
    id,
    title: raw?.title || '',
    company: raw?.company || '',
    location: raw?.location || '',
    type: raw?.type || 'full-time',
    salary: raw?.salary,
    description: raw?.description || '',
    requirements: Array.isArray(raw?.requirements) ? raw.requirements : [],
    responsibilities: Array.isArray(raw?.responsibilities) ? raw.responsibilities : [],
    skills: Array.isArray(raw?.skills) ? raw.skills : [],
    postedBy: mapUser(postedByRaw),
    applicants: Array.isArray(raw?.applicants) ? raw.applicants : [],
    deadline: raw?.deadline || raw?.expiresAt,
    status: raw?.status || 'active',
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
    hasApplied: Boolean(raw?.hasApplied),
  };
};

const mapApplication = (raw: any): JobApplication => ({
  id: raw?._id || raw?.id || '',
  jobId: raw?.jobId || raw?.Job?._id || raw?.Job?.id || '',
  applicant: mapUser(raw?.applicant || raw?.user || { id: raw?.userId || '', firstName: 'Applicant' }),
  coverLetter: raw?.coverLetter || '',
  resume: raw?.resumeUrl || raw?.resume,
  status: raw?.status || 'pending',
  appliedAt: raw?.createdAt || new Date().toISOString(),
});

export const jobsService = {
  getJobs: async (params: PaginationParams & { filters?: any } = {}): Promise<PaginatedResponse<Job>> => {
    const { page = 1, limit = 10, filters = {} } = params;
    const response = await api.get('/jobs', {
      params: { page, limit, ...filters },
    });
    return toPaginated<Job>(response, mapJob);
  },

  getJobById: async (jobId: string): Promise<Job> => {
    const response = await api.get(`/jobs/${jobId}`);
    const data = extractData<any>(response);
    return mapJob(data.job || data);
  },

  createJob: async (jobData: Partial<Job>): Promise<Job> => {
    const response = await api.post('/jobs', jobData);
    const data = extractData<any>(response);
    return mapJob(data.job || data);
  },

  updateJob: async (jobId: string, data: Partial<Job>): Promise<Job> => {
    const response = await api.put(`/jobs/${jobId}`, data);
    const payload = extractData<any>(response);
    return mapJob(payload.job || payload);
  },

  deleteJob: async (jobId: string): Promise<void> => {
    await api.delete(`/jobs/${jobId}`);
  },

  applyToJob: async (jobId: string, application: Partial<JobApplication>): Promise<JobApplication> => {
    const response = await api.post(`/jobs/${jobId}/apply`, {
      coverLetter: application.coverLetter || '',
      resumeUrl: application.resume || '',
    });
    const data = extractData<any>(response);
    return mapApplication(data.application || data);
  },

  getMyApplications: async (): Promise<JobApplication[]> => {
    const response = await api.get('/jobs/applications');
    const data = extractData<any>(response);
    const items = Array.isArray(data?.applications) ? data.applications : [];
    return items.map(mapApplication);
  },

  getJobApplicants: async (jobId: string): Promise<JobApplication[]> => {
    await Promise.resolve(jobId);
    return [];
  },

  updateApplicationStatus: async (
    jobId: string,
    applicationId: string,
    status: JobApplication['status']
  ): Promise<JobApplication> => {
    await Promise.resolve(jobId);
    const response = await api.put(`/jobs/applications/${applicationId}/status`, { status });
    const data = extractData<any>(response);
    return mapApplication(data.application || data);
  },

  saveJob: async (jobId: string): Promise<void> => {
    await Promise.resolve(jobId);
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await Promise.resolve(jobId);
  },

  getSavedJobs: async (): Promise<Job[]> => {
    return [];
  },
};
