import { Model, Optional } from 'sequelize';
export interface JobAttributes {
    id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
    salary?: {
        min?: number;
        max?: number;
        currency?: string;
        period?: 'hourly' | 'monthly' | 'yearly';
    };
    requirements: string[];
    skills: string[];
    postedBy: string;
    status: 'active' | 'closed' | 'draft';
    expiresAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'salary' | 'status' | 'expiresAt' | 'createdAt' | 'updatedAt'> {
}
declare class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
    id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
    salary: any;
    requirements: string[];
    skills: string[];
    postedBy: string;
    status: 'active' | 'closed' | 'draft';
    expiresAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Job;
//# sourceMappingURL=Job.d.ts.map