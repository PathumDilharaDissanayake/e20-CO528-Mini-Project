import { Model, Optional } from 'sequelize';
export interface AuthorInfo {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
}
export interface PostAttributes {
    id: string;
    userId: string;
    author?: AuthorInfo;
    content: string;
    mediaUrls?: string[];
    type: 'text' | 'image' | 'video' | 'document' | 'poll';
    likes: number;
    comments: number;
    shares: number;
    isPublic: boolean;
    pollOptions?: Array<{
        text: string;
        votes: string[];
    }> | null;
    pollEndsAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'author' | 'likes' | 'comments' | 'shares' | 'isPublic' | 'pollOptions' | 'pollEndsAt' | 'createdAt' | 'updatedAt'> {
}
declare class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
    id: string;
    userId: string;
    author: AuthorInfo;
    content: string;
    mediaUrls: string[];
    type: 'text' | 'image' | 'video' | 'document' | 'poll';
    likes: number;
    comments: number;
    shares: number;
    isPublic: boolean;
    pollOptions: Array<{
        text: string;
        votes: string[];
    }> | null;
    pollEndsAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Post;
//# sourceMappingURL=Post.d.ts.map