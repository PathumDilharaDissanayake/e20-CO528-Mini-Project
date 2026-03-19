/**
 * User Service — Business logic layer for user-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */

import { Op } from 'sequelize';
import { Profile } from '../models';
import { logger } from '../utils/logger';

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

// ─── Read ─────────────────────────────────────────────────────────────────────

export const listUsers = async (
  q: string | undefined,
  page = 1,
  limit = 20
): Promise<ListResult<Profile>> => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const offset = (page - 1) * safeLimit;
  const where: Record<string, unknown> = {};
  if (q) {
    (where as any)[Op.or] = [
      { firstName: { [Op.iLike]: `%${q}%` } },
      { lastName:  { [Op.iLike]: `%${q}%` } },
      { email:     { [Op.iLike]: `%${q}%` } },
      { headline:  { [Op.iLike]: `%${q}%` } }
    ];
  }
  const { count, rows } = await Profile.findAndCountAll({
    where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
  });
  return { items: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};

export const getUserById = async (userId: string): Promise<Profile | null> => {
  return Profile.findOne({ where: { userId } });
};

/**
 * Get (or create) the requesting user's profile, keeping it in sync
 * with auth-service data injected via gateway headers.
 */
export const getOrSyncMyProfile = async (headers: ProfileSyncHeaders): Promise<Profile> => {
  const { userId, email, role, firstName, lastName } = headers;
  let profile = await Profile.findOne({ where: { userId } });
  if (!profile) {
    profile = await Profile.create({
      userId,
      email: email || '',
      role: role || 'student',
      firstName: firstName || '',
      lastName: lastName || '',
      skills: [], interests: [], education: [], experience: [], socialLinks: {}
    });
  } else {
    const updates: Record<string, string> = {};
    if (email     && profile.email     !== email)     updates.email     = email;
    if (role      && profile.role      !== role)      updates.role      = role;
    if (firstName && profile.firstName !== firstName) updates.firstName = firstName;
    if (lastName  && profile.lastName  !== lastName)  updates.lastName  = lastName;
    if (Object.keys(updates).length) await profile.update(updates);
  }
  return profile;
};

export const searchUsers = async (opts: SearchOptions): Promise<ListResult<Profile>> => {
  const { q, role, skill, page = 1, limit = 20 } = opts;
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const offset = (page - 1) * safeLimit;
  const where: Record<string, unknown> = {};
  if (role)  where.role = role;
  if (skill) where.skills = { [Op.contains]: [skill] };
  if (q) {
    (where as any)[Op.or] = [
      { firstName: { [Op.iLike]: `%${q}%` } },
      { lastName:  { [Op.iLike]: `%${q}%` } },
      { email:     { [Op.iLike]: `%${q}%` } },
      { headline:  { [Op.iLike]: `%${q}%` } },
      { bio:       { [Op.iLike]: `%${q}%` } }
    ];
  }
  const { count, rows } = await Profile.findAndCountAll({
    where, order: [['createdAt', 'DESC']], limit: safeLimit, offset
  });
  return { items: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const updateProfile = async (userId: string, data: Record<string, unknown>): Promise<Profile> => {
  const [profile] = await Profile.findOrCreate({
    where: { userId },
    defaults: { userId, skills: [], interests: [], education: [], experience: [], socialLinks: {}, ...data }
  });
  if (Object.keys(data).length) await profile.update(data);
  return profile;
};

export const deleteProfile = async (
  requestingUserId: string,
  targetUserId: string,
  userRole: string
): Promise<void> => {
  if (requestingUserId !== targetUserId && userRole !== 'admin') {
    throw Object.assign(new Error('Insufficient permissions'), { statusCode: 403 });
  }
  const profile = await Profile.findOne({ where: { userId: targetUserId } });
  if (profile) await profile.destroy();
};
