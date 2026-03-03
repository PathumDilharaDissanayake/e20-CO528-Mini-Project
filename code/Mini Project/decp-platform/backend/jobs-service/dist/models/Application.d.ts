import { Model, Optional } from 'sequelize';
export interface ApplicationAttributes {
    id: string;
    jobId: string;
    userId: string;
    resumeUrl?: string;
    coverLetter?: string;
    status: 'pending' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'withdrawn';
    answers?: Record<string, string>;
    createdAt?: Date;
    updatedAt?: Date;
}
interface ApplicationCreationAttributes extends Optional<ApplicationAttributes, 'id' | 'resumeUrl' | 'coverLetter' | 'answers' | 'status' | 'createdAt' | 'updatedAt'> {
}
declare class Application extends Model<ApplicationAttributes, ApplicationCreationAttributes> implements ApplicationAttributes {
    id: string;
    jobId: string;
    userId: string;
    resumeUrl: string;
    coverLetter: string;
    status: 'pending' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'withdrawn';
    answers: Record<string, string>;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Application;
//# sourceMappingURL=Application.d.ts.map