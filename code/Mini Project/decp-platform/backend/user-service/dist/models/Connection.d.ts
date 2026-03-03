import { Model, Optional } from 'sequelize';
export interface ConnectionAttributes {
    id: string;
    followerId: string;
    followingId: string;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt?: Date;
    updatedAt?: Date;
}
interface ConnectionCreationAttributes extends Optional<ConnectionAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class Connection extends Model<ConnectionAttributes, ConnectionCreationAttributes> implements ConnectionAttributes {
    id: string;
    followerId: string;
    followingId: string;
    status: 'pending' | 'accepted' | 'blocked';
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Connection;
//# sourceMappingURL=Connection.d.ts.map