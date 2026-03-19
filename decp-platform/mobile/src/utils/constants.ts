import { Platform } from 'react-native';

// API Configuration
export const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3000/api/v1',
  android: 'http://10.0.2.2:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

export const SOCKET_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

// App Configuration
export const APP_NAME = 'DECP';
export const APP_VERSION = '1.0.0';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: '@decp_token',
  REFRESH_TOKEN: '@decp_refresh_token',
  USER: '@decp_user',
  THEME: '@decp_theme',
  NOTIFICATIONS: '@decp_notifications',
};

// Colors
export const COLORS = {
  primary: '#6200ee',
  primaryDark: '#3700b3',
  primaryLight: '#bb86fc',
  secondary: '#03dac6',
  secondaryDark: '#018786',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#b00020',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
  text: '#000000',
  textSecondary: '#666666',
  disabled: '#9e9e9e',
  placeholder: '#999999',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#ff4081',
};

// Dark Theme Colors
export const DARK_COLORS = {
  primary: '#bb86fc',
  primaryDark: '#3700b3',
  primaryLight: '#6200ee',
  secondary: '#03dac6',
  secondaryDark: '#018786',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#cf6679',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  disabled: '#666666',
  placeholder: '#888888',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  notification: '#ff4081',
};

// Font Sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Animation
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  MAX_POST_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
};

// Roles
export const USER_ROLES = [
  { value: 'student', label: 'Student', icon: 'school' },
  { value: 'alumni', label: 'Alumni', icon: 'briefcase' },
  { value: 'faculty', label: 'Faculty', icon: 'account-tie' },
];

export const ALL_ROLES = [
  ...USER_ROLES,
  { value: 'admin', label: 'Admin', icon: 'shield-account' },
];

// Job Types
export const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

// Event Types
export const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop', icon: 'hammer-wrench' },
  { value: 'seminar', label: 'Seminar', icon: 'presentation' },
  { value: 'networking', label: 'Networking', icon: 'account-network' },
  { value: 'career_fair', label: 'Career Fair', icon: 'briefcase-account' },
  { value: 'other', label: 'Other', icon: 'calendar' },
];

// Research Fields
export const RESEARCH_FIELDS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Medicine',
  'Science',
  'Arts',
  'Social Sciences',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Psychology',
  'Law',
  'Education',
];

// Departments
export const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Medicine',
  'Law',
  'Psychology',
  'Sociology',
  'English',
  'History',
];
