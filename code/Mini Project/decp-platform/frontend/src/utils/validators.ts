import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    role: z.enum(['student', 'alumni', 'faculty']),
    department: z.string().min(1, 'Department is required'),
    graduationYear: z.number().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'student' || data.role === 'alumni') {
        return !!data.graduationYear;
      }
      return true;
    },
    {
      message: 'Graduation year is required for students and alumni',
      path: ['graduationYear'],
    }
  );

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  skills: z.array(z.string()),
});

export const postSchema = z.object({
  content: z.string().min(0).max(5000, 'Content is too long').default(''),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(1000, 'Comment is too long'),
});

export const jobSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  company: z.string().min(2, 'Company is required'),
  location: z.string().min(2, 'Location is required'),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  deadline: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['webinar', 'workshop', 'networking', 'career_fair', 'seminar']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  isOnline: z.boolean(),
  meetingLink: z.string().optional(),
  maxAttendees: z.number().optional(),
});

export const researchSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  field: z.string().min(1, 'Field is required'),
  status: z.enum(['ongoing', 'completed', 'published']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  funding: z.string().optional(),
  tags: z.array(z.string()),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type JobFormData = z.infer<typeof jobSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type ResearchFormData = z.infer<typeof researchSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
