import { Model, Optional } from 'sequelize';
export interface PostAttributes {
    id: string;
    userId: string;
    content: string;
    mediaUrls?: string[];
    type: 'text' | 'image' | 'video' | 'document';
    likes: number;
    comments: number;
    shares: number;
    isPublic: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'likes' | 'comments' | 'shares' | 'isPublic' | 'createdAt' | 'updatedAt'> {
}
declare class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
    id: string;
    userId: string;
    content: string;
    mediaUrls: string[];
    type: 'text' | 'image' | 'video' | 'document';
    likes: number;
    comments: number;
    shares: number;
    isPublic: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Post;
//# sourceMappingURL=Post.d.ts.map