import { Model, Optional } from 'sequelize';
export interface LikeAttributes {
    id: string;
    postId: string;
    userId: string;
    createdAt?: Date;
}
interface LikeCreationAttributes extends Optional<LikeAttributes, 'id' | 'createdAt'> {
}
declare class Like extends Model<LikeAttributes, LikeCreationAttributes> implements LikeAttributes {
    id: string;
    postId: string;
    userId: string;
    readonly createdAt: Date;
}
export default Like;
//# sourceMappingURL=Like.d.ts.map