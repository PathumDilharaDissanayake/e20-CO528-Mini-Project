/**
 * User Service — Business logic layer for user-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
import { Profile } from '../models';
export interface ProfileSyncHeaders {
    userId: string;
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
}
export interface SearchOptions {
    q?: string;
    role?: string;
    skill?: string;
    page?: number;
    limit?: number;
}
export interface ListResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare const listUsers: (q: string | undefined, page?: number, limit?: number) => Promise<ListResult<Profile>>;
export declare const getUserById: (userId: string) => Promise<Profile | null>;
/**
 * Get (or create) the requesting user's profile, keeping it in sync
 * with auth-service data injected via gateway headers.
 */
export declare const getOrSyncMyProfile: (headers: ProfileSyncHeaders) => Promise<Profile>;
export declare const searchUsers: (opts: SearchOptions) => Promise<ListResult<Profile>>;
export declare const updateProfile: (userId: string, data: Record<string, unknown>) => Promise<Profile>;
export declare const deleteProfile: (requestingUserId: string, targetUserId: string, userRole: string) => Promise<void>;
//# sourceMappingURL=userService.d.ts.map