"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.changeUserPassword = changeUserPassword;
exports.getUserOrders = getUserOrders;
// @ts-nocheck
const User_1 = require("../models/User");
const Order_1 = require("../models/Order");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const auth_1 = require("../lib/auth");
async function getUserProfile(userId) {
    logger_1.logger.info({ userId }, 'profileService.getUserProfile:start');
    const user = await User_1.User.findById(userId).select('-passwordHash -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt');
    if (!user)
        throw errors_1.errors.notFound('User not found');
    logger_1.logger.info({ userId }, 'profileService.getUserProfile:success');
    return {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
    };
}
async function updateUserProfile(userId, updates) {
    logger_1.logger.info({ userId, updates }, 'profileService.updateUserProfile:start');
    const user = await User_1.User.findById(userId);
    if (!user)
        throw errors_1.errors.notFound('User not found');
    // Check if email is being changed and if it's already in use
    if (updates.email && updates.email !== user.email) {
        const existing = await User_1.User.findOne({ email: updates.email });
        if (existing)
            throw errors_1.errors.conflict('Email already in use');
        user.email = updates.email;
        // Note: In production, you might want to re-verify the email
        user.isVerified = false; // Force re-verification for email changes
    }
    if (updates.name) {
        user.name = updates.name;
    }
    if (updates.phone !== undefined) {
        user.phone = updates.phone || undefined;
    }
    if (updates.address !== undefined) {
        user.address = updates.address || undefined;
    }
    try {
        await user.save();
    }
    catch (err) {
        if (err.code === 11000) {
            if (err.keyPattern?.email)
                throw errors_1.errors.conflict('Email already in use');
            if (err.keyPattern?.phone)
                throw errors_1.errors.conflict('Phone number already in use');
            throw errors_1.errors.conflict('Duplicate value');
        }
        throw err;
    }
    logger_1.logger.info({ userId }, 'profileService.updateUserProfile:success');
    return {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
        isVerified: user.isVerified,
    };
}
async function changeUserPassword(userId, currentPassword, newPassword) {
    logger_1.logger.info({ userId }, 'profileService.changePassword:start');
    const user = await User_1.User.findById(userId);
    if (!user)
        throw errors_1.errors.notFound('User not found');
    // Verify current password
    const isValid = await (0, auth_1.verifyPassword)(currentPassword, user.password);
    if (!isValid)
        throw errors_1.errors.badRequest('Current password is incorrect');
    // Hash and update new password
    user.password = await (0, auth_1.hashPassword)(newPassword);
    await user.save();
    logger_1.logger.info({ userId }, 'profileService.changePassword:success');
    return { message: 'Password changed successfully' };
}
async function getUserOrders(userId) {
    logger_1.logger.info({ userId }, 'profileService.getUserOrders:start');
    const orders = await Order_1.Order.find({ userId })
        .sort({ createdAt: -1 }) // Most recent first
        .populate('items.productId', 'slug name price')
        .limit(50); // Limit to last 50 orders
    logger_1.logger.info({ userId, count: orders.length }, 'profileService.getUserOrders:success');
    return orders.map(order => ({
        _id: order._id.toString(),
        items: order.items.map((item) => ({
            product: {
                slug: item.productId?.slug || 'unknown',
                name: item.name,
                price: item.price,
            },
            quantity: item.quantity,
            price: item.price * item.quantity,
        })),
        total: order.total,
        status: order.status,
        address: order.address,
        phone: order.phone,
        createdAt: order.createdAt,
    }));
}
