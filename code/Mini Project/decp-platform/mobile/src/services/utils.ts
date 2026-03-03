import { AxiosResponse } from 'axios';
import { PaginatedResponse, User } from '../types';

export const extractData = <T>(response: AxiosResponse<any>): T => {
  const payload = response.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export const toPaginated = <T>(
  response: AxiosResponse<any>,
  mapper: (item: any) => T
): PaginatedResponse<T> => {
  const payload = response.data || {};
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const meta = payload.meta || {};
  const page = Number(meta.page || 1);
  const limit = Number(meta.limit || rows.length || 10);
  const total = Number(meta.total || rows.length || 0);
  const totalPages = Number(meta.totalPages || 1);

  return {
    data: rows.map(mapper),
    page,
    limit,
    total,
    hasMore: page < totalPages,
  };
};

export const mapUser = (raw: any): User => {
  const id = raw?._id || raw?.id || raw?.userId || '';
  return {
    id,
    email: raw?.email || '',
    firstName: raw?.firstName || raw?.name || 'User',
    lastName: raw?.lastName || '',
    avatar: raw?.avatar || raw?.profilePicture,
    bio: raw?.bio,
    role: raw?.role || 'student',
    department: raw?.department,
    graduationYear: raw?.graduationYear,
    jobTitle: raw?.jobTitle,
    company: raw?.company,
    location: raw?.location,
    skills: Array.isArray(raw?.skills) ? raw.skills : [],
    connections: Array.isArray(raw?.connections) ? raw.connections : [],
    connectionRequests: Array.isArray(raw?.connectionRequests) ? raw.connectionRequests : [],
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || new Date().toISOString(),
  };
};
