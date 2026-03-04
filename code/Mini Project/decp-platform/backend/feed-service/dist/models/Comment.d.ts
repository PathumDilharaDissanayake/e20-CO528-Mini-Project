import { Model, Optional } from 'sequelize';
import { AuthorInfo } from './Post';
export interface CommentAttributes {
    id: string;
    postId: string;
    userId: string;
    author?: AuthorInfo;
    content: string;
    parentId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'author' | 'parentId' | 'createdAt' | 'updatedAt'> {
}
declare class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
    id: string;
    postId: string;
    userId: string;
    author: AuthorInfo;
    content: string;
    parentId: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Comment;
//# sourceMappingURL=Comment.d.ts.map