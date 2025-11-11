import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid token'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const adminUpdateSchema = z
  .object({
    email: z.string().email('Enter a valid email address').optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').optional()
  })
  .refine((d) => (d.newPassword ? !!d.currentPassword : true), {
    message: 'Current password is required to change password',
    path: ['currentPassword']
  })
  .refine((d) => d.email !== undefined || d.newPassword !== undefined, {
    message: 'Provide at least one of email or newPassword',
    path: ['email']
  });


