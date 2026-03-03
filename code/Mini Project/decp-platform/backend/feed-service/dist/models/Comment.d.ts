import { Model, Optional } from 'sequelize';
export interface CommentAttributes {
    id: string;
    postId: string;
    userId: string;
    content: string;
    parentId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'parentId' | 'createdAt' | 'updatedAt'> {
}
declare class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
    id: string;
    postId: string;
    userId: string;
    content: string;
    parentId: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Comment;
//# sourceMappingURL=Comment.d.ts.map