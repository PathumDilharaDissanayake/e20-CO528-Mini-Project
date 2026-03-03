/**
 * Post Service — Business logic layer for the feed-service.
 * Controllers delegate all domain logic here; this layer is fully unit-testable
 * without an HTTP layer or live database connection.
 *
 * Agent: A-06 (Backend Implementation Agent)
 * Fixes: FLAW-003, FLAW-004, FLAW-012 (transactions + idempotency)
 */
import { Post, Comment } from '../models';
export interface FeedOptions {
    page?: number;
    limit?: number;
    cursor?: string;
    userId?: string;
    requestingUserId?: string;
}
export interface FeedResult {
    posts: Post[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor: string | null;
}
export interface CreatePostInput {
    userId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'document';
    isPublic?: boolean;
    mediaUrls?: string[];
}
export interface CommentInput {
    userId: string;
    postId: string;
    content: string;
    parentId?: string;
}
/**
 * Retrieve paginated feed. Supports both offset (legacy) and cursor-based pagination.
 * When `cursor` is provided, it overrides `page` and uses createdAt-based cursor.
 */
export declare const getFeed: (options: FeedOptions) => Promise<FeedResult>;
export declare const getPostById: (postId: string) => Promise<Post | null>;
export declare const createPost: (input: CreatePostInput) => Promise<Post>;
export declare const updatePost: (postId: string, userId: string, updates: {
    content?: string;
    isPublic?: boolean;
}) => Promise<Post>;
export declare const deletePost: (postId: string, userId: string, userRole: string) => Promise<void>;
export interface LikeResult {
    liked: boolean;
    likesCount: number;
}
/**
 * Toggle like on a post. Uses a Sequelize transaction to ensure the Like record
 * and the Post.likes counter are always in sync (FLAW-003 fix).
 * Uses findOrCreate so the result is idempotent from the caller's perspective.
 */
export declare const toggleLike: (postId: string, userId: string) => Promise<LikeResult>;
export declare const getComments: (postId: string, page?: number, limit?: number) => Promise<{
    comments: Comment[];
    total: number;
}>;
export declare const addComment: (input: CommentInput) => Promise<Comment>;
export declare const deleteComment: (postId: string, commentId: string, userId: string, userRole: string) => Promise<void>;
export interface ShareResult {
    shared: boolean;
    sharesCount: number;
}
/**
 * Toggle share on a post. Uses findOrCreate so a user cannot inflate the share count
 * by calling this endpoint multiple times (FLAW-004 fix).
 */
export declare const toggleShare: (postId: string, userId: string) => Promise<ShareResult>;
//# sourceMappingURL=postService.d.ts.map