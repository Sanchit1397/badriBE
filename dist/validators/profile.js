"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: zod_1.z.string().email('Invalid email').optional(),
    phone: zod_1.z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    address: zod_1.z.string().min(10, 'Address must be at least 10 characters').optional(),
}).refine(data => data.name || data.email || data.phone || data.address, {
    message: 'At least one field must be provided'
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
