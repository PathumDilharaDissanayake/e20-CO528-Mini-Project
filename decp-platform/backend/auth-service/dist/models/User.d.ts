import { Model, Optional } from 'sequelize';
export interface UserAttributes {
    id: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    graduationYear?: number;
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    googleId?: string;
    profilePicture?: string;
    lastLogin?: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isEmailVerified' | 'isActive' | 'createdAt' | 'updatedAt'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    graduationYear?: number;
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    googleId?: string;
    profilePicture?: string;
    lastLogin?: Date;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getFullName(): string;
}
export default User;
//# sourceMappingURL=User.d.ts.map