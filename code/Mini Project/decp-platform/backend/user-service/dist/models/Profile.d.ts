import { Model, Optional } from 'sequelize';
export interface ProfileAttributes {
    id: string;
    userId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    avatar?: string;
    department?: string;
    graduationYear?: number;
    isEmailVerified?: boolean;
    bio?: string;
    headline?: string;
    location?: string;
    website?: string;
    phone?: string;
    skills?: string[];
    interests?: string[];
    education?: {
        institution: string;
        degree: string;
        fieldOfStudy: string;
        startYear: number;
        endYear?: number;
        current: boolean;
    }[];
    experience?: {
        company: string;
        title: string;
        location?: string;
        startDate: string;
        endDate?: string;
        current: boolean;
        description?: string;
    }[];
    socialLinks?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
interface ProfileCreationAttributes extends Optional<ProfileAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class Profile extends Model<ProfileAttributes, ProfileCreationAttributes> implements ProfileAttributes {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar: string;
    department: string;
    graduationYear: number;
    isEmailVerified: boolean;
    bio: string;
    headline: string;
    location: string;
    website: string;
    phone: string;
    skills: string[];
    interests: string[];
    education: any[];
    experience: any[];
    socialLinks: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Profile;
//# sourceMappingURL=Profile.d.ts.map