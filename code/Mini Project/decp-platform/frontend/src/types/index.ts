export interface User {
  id?: string;
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  profilePicture?: string;
  role: 'student' | 'alumni' | 'faculty' | 'admin';
  department?: string;
  graduationYear?: number;
  bio?: string;
  headline?: string;
  location?: string;
  company?: string;
  position?: string;
  skills?: string[];
  connections?: string[];
  createdAt?: string;
  isEmailVerified?: boolean;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  website?: string;
  phone?: string;
  interests?: string[];
  education?: Array<{ institution?: string; degree?: string; fieldOfStudy?: string; startYear?: number; endYear?: number; current?: boolean }>;
  experience?: Array<{ company?: string; title?: string; location?: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>;
}

export interface Post {
  id?: string;
  _id?: string;
  userId?: string;
  author?: User;
  content?: string;
  type?: 'text' | 'image' | 'video' | 'document';
  media?: { url: string; type: 'image' | 'video' }[];
  mediaUrls?: string[];
  likes?: string[] | number;
  comments?: Comment[] | number;
  shares?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id?: string;
  _id?: string;
  userId?: string;
  author?: User;
  content?: string;
  createdAt?: string;
}

export interface Job {
  id?: string;
  _id?: string;
  title?: string;
  company?: string;
  location?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description?: string;
  requirements?: string[];
  skills?: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
    period?: string;
  };
  postedBy?: User | string;
  applications?: JobApplication[];
  deadline?: string;
  expiresAt?: string;
  createdAt?: string;
  isActive?: boolean;
  status?: string;
}

export interface JobApplication {
  id?: string;
  _id?: string;
  applicant?: User;
  resume?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt?: string;
  createdAt?: string;
}

export interface Event {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  type: 'webinar' | 'workshop' | 'networking' | 'career_fair' | 'seminar' | 'other';
  startDate?: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  isVirtual?: boolean;
  meetingLink?: string;
  organizer?: User;
  organizerId?: string;
  attendees?: string[];
  rsvps?: Array<{ userId: string; status: string }>;
  maxAttendees?: number;
  capacity?: number;
  banner?: string;
  imageUrl?: string;
  createdAt?: string;
  status?: string;
}

export interface ResearchProject {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  abstract?: string;
  field?: string;
  leadResearcher?: User;
  leadResearcherId?: string;
  collaborators?: User[] | string[];
  documents?: ResearchDocument[] | string[];
  status?: 'ongoing' | 'completed' | 'published' | 'planning' | 'active' | 'on_hold';
  startDate?: string;
  endDate?: string;
  funding?: string;
  tags?: string[];
  visibility?: 'public' | 'private' | 'department';
  createdAt?: string;
}

export interface ResearchDocument {
  id?: string;
  _id?: string;
  name?: string;
  url?: string;
  type?: string;
  uploadedBy?: User;
  uploadedAt?: string;
}

export interface Chat {
  id?: string;
  _id?: string;
  participants: User[];
  isGroup?: boolean;
  type?: 'direct' | 'group';
  groupName?: string;
  title?: string;
  groupAvatar?: string;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id?: string;
  _id?: string;
  chat?: string;
  conversationId?: string;
  sender?: User;
  senderId?: string;
  content?: string;
  type?: string;
  attachments?: { url: string; type: string; name: string }[];
  readBy?: string[];
  createdAt?: string;
}

export interface Notification {
  id?: string;
  _id?: string;
  recipient?: string;
  userId?: string;
  type: 'like' | 'comment' | 'share' | 'connection' | 'message' | 'job' | 'event' | 'research' | 'mention' | 'system';
  title?: string;
  message?: string;
  body?: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  createdAt?: string;
}

export interface Analytics {
  activeUsers?: {
    date?: string;
    count?: number;
  }[];
  popularPosts?: Post[];
  jobStats?: {
    totalJobs?: number;
    activeJobs?: number;
    totalApplications?: number;
    pendingApplications?: number;
  };
  engagementMetrics?: {
    postsCreated?: number;
    commentsAdded?: number;
    likesGiven?: number;
    eventsCreated?: number;
    eventsAttended?: number;
  };
  totalActivities?: number;
  uniqueUsers?: number;
  activitiesByType?: Array<{ entityType: string; count: number }>;
  activitiesByDay?: Array<{ date: string; count: number }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'alumni' | 'faculty';
  department: string;
  graduationYear?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
