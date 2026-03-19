import { Model, Optional } from 'sequelize';
export interface RefreshTokenAttributes {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'isRevoked' | 'createdAt' | 'updatedAt'> {
}
declare class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    isRevoked: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default RefreshToken;
//# sourceMappingURL=RefreshToken.d.ts.map