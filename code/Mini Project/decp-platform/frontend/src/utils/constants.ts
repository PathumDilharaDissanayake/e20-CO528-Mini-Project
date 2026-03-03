export const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
] as const;

export const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'faculty', label: 'Faculty' },
] as const;

export const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
] as const;

export const EVENT_TYPES = [
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'networking', label: 'Networking' },
  { value: 'career_fair', label: 'Career Fair' },
  { value: 'seminar', label: 'Seminar' },
] as const;

export const RESEARCH_FIELDS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Cloud Computing',
  'Blockchain',
  'IoT',
  'Robotics',
  'Computer Vision',
  'Natural Language Processing',
  'Software Engineering',
  'Computer Networks',
  'Database Systems',
  'Human-Computer Interaction',
  'Quantum Computing',
] as const;

export const RESEARCH_STATUS = [
  { value: 'ongoing', label: 'Ongoing', color: '#2196f3' },
  { value: 'completed', label: 'Completed', color: '#4caf50' },
  { value: 'published', label: 'Published', color: '#9c27b0' },
] as const;

export const APPLICATION_STATUS = [
  { value: 'pending', label: 'Pending', color: '#ff9800' },
  { value: 'reviewed', label: 'Reviewed', color: '#2196f3' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#9c27b0' },
  { value: 'rejected', label: 'Rejected', color: '#f44336' },
  { value: 'hired', label: 'Hired', color: '#4caf50' },
] as const;

export const NOTIFICATION_TYPES = {
  like: { icon: 'Favorite', color: '#f44336' },
  comment: { icon: 'Comment', color: '#2196f3' },
  share: { icon: 'Share', color: '#4caf50' },
  connection: { icon: 'PersonAdd', color: '#9c27b0' },
  message: { icon: 'Message', color: '#ff9800' },
  job: { icon: 'Work', color: '#795548' },
  event: { icon: 'Event', color: '#e91e63' },
  research: { icon: 'Science', color: '#00bcd4' },
} as const;

export const NAV_ITEMS = [
  { path: '/', label: 'Feed', icon: 'Home' },
  { path: '/jobs', label: 'Jobs', icon: 'Work' },
  { path: '/events', label: 'Events', icon: 'Event' },
  { path: '/research', label: 'Research', icon: 'Science' },
  { path: '/messages', label: 'Messages', icon: 'Message' },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const DEFAULT_AVATAR = '/default-avatar.png';
export const DEFAULT_BANNER = '/default-banner.png';

export const MESSAGES_PER_PAGE = 50;
export const POSTS_PER_PAGE = 10;
export const JOBS_PER_PAGE = 10;
export const EVENTS_PER_PAGE = 10;
export const NOTIFICATIONS_PER_PAGE = 20;
