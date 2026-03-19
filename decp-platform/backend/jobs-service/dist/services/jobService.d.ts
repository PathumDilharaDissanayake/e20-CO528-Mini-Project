/**
 * Job Service — Business logic layer for jobs-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
import { Job, Application } from '../models';
export interface JobFilters {
    q?: string;
    type?: string;
    location?: string;
    skill?: string;
    postedBy?: string;
    requestingUserId?: string;
    page?: number;
    limit?: number;
}
export interface JobInput {
    title: string;
    description: string;
    company: string;
    location: string;
    type: string;
    salary?: object;
    requirements?: string[];
    skills?: string[];
    expiresAt?: Date;
}
export declare const listJobs: (filters: JobFilters) => Promise<{
    jobs: Job[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare const getJobById: (jobId: string) => Promise<Job>;
export declare const getMyApplications: (userId: string) => Promise<Application[]>;
export declare const createJob: (userId: string, data: JobInput) => Promise<Job>;
export declare const updateJob: (jobId: string, userId: string, data: Partial<JobInput>) => Promise<Job>;
export declare const deleteJob: (jobId: string, userId: string, userRole: string) => Promise<void>;
export declare const applyForJob: (jobId: string, userId: string, applicationData: {
    resumeUrl?: string;
    coverLetter?: string;
    answers?: object;
}) => Promise<Application>;
export declare const updateApplicationStatus: (applicationId: string, userId: string, status: string) => Promise<Application>;
//# sourceMappingURL=jobService.d.ts.map