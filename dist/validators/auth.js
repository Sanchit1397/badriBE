"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.resendVerificationSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters')
});
exports.resendVerificationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Enter a valid email address')
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Enter a valid email address')
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10, 'Invalid token'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters')
});
exports.adminUpdateSchema = zod_1.z
    .object({
    email: zod_1.z.string().email('Enter a valid email address').optional(),
    currentPassword: zod_1.z.string().min(6).optional(),
    newPassword: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional()
})
    .refine((d) => (d.newPassword ? !!d.currentPassword : true), {
    message: 'Current password is required to change password',
    path: ['currentPassword']
})
    .refine((d) => d.email !== undefined || d.newPassword !== undefined, {
    message: 'Provide at least one of email or newPassword',
    path: ['email']
});
