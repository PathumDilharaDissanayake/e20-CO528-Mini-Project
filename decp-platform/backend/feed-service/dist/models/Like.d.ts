import { Model, Optional } from 'sequelize';
export interface LikeAttributes {
    id: string;
    postId: string;
    userId: string;
    reactionType: 'like' | 'love' | 'celebrate' | 'insightful' | 'curious';
    createdAt?: Date;
}
interface LikeCreationAttributes extends Optional<LikeAttributes, 'id' | 'reactionType' | 'createdAt'> {
}
declare class Like extends Model<LikeAttributes, LikeCreationAttributes> implements LikeAttributes {
    id: string;
    postId: string;
    userId: string;
    reactionType: 'like' | 'love' | 'celebrate' | 'insightful' | 'curious';
    readonly createdAt: Date;
}
export default Like;
//# sourceMappingURL=Like.d.ts.map