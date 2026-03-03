// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  role: 'student' | 'alumni' | 'faculty' | 'admin';
  department?: string;
  graduationYear?: number;
  jobTitle?: string;
  company?: string;
  location?: string;
  skills: string[];
  connections: string[];
  connectionRequests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  postsCount: number;
  connectionsCount: number;
  isConnected?: boolean;
  hasPendingRequest?: boolean;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  department?: string;
  graduationYear?: number;
}

// Post Types
export interface Post {
  id: string;
  author: User;
  content: string;
  media?: PostMedia[];
  likes: string[];
  comments: Comment[];
  shares: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  postedBy: User;
  applicants: string[];
  deadline?: string;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  hasApplied?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicant: User;
  coverLetter: string;
  resume?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  appliedAt: string;
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'workshop' | 'seminar' | 'networking' | 'career_fair' | 'other';
  location: {
    type: 'physical' | 'virtual' | 'hybrid';
    address?: string;
    link?: string;
  };
  startDate: string;
  endDate: string;
  organizer: User;
  attendees: string[];
  maxAttendees?: number;
  banner?: string;
  isAttending?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Research Types
export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  abstract: string;
  field: string;
  status: 'ongoing' | 'completed' | 'proposed';
  leadResearcher: User;
  collaborators: User[];
  funding?: {
    source: string;
    amount: number;
    currency: string;
  };
  publications: Publication[];
  startDate: string;
  endDate?: string;
  tags: string[];
  isCollaborator?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  title: string;
  journal?: string;
  conference?: string;
  year: number;
  doi?: string;
  url?: string;
}

// Message Types
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'job' | 'event' | 'mention' | 'connection_request';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// Analytics Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalPosts: number;
  totalJobs: number;
  totalEvents: number;
  engagementRate: number;
}

export interface UserGrowthData {
  labels: string[];
  data: number[];
}

export interface EngagementData {
  labels: string[];
  posts: number[];
  likes: number[];
  comments: number[];
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Theme Types
export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
}

// Search Types
export interface SearchFilters {
  query?: string;
  type?: 'all' | 'users' | 'posts' | 'jobs' | 'events';
  dateRange?: {
    start: string;
    end: string;
  };
}
