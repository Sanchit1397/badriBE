// @ts-nocheck
import { User } from '../models/User';
import { Order } from '../models/Order';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';
import { hashPassword, verifyPassword } from '../lib/auth';
import { findUserByEmail, normalizeEmail } from './authService';
import { applyOrderSearch } from '../lib/orderSearch';

export async function getUserProfile(userId: string) {
  logger.info({ userId }, 'profileService.getUserProfile:start');
  
  const user = await User.findById(userId).select('-passwordHash -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt');
  
  if (!user) throw errors.notFound('User not found');
  
  logger.info({ userId }, 'profileService.getUserProfile:success');
  
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

export async function updateUserProfile(userId: string, updates: { name?: string; email?: string; phone?: string; address?: string }) {
  logger.info({ userId, updates }, 'profileService.updateUserProfile:start');
  
  const user = await User.findById(userId);
  if (!user) throw errors.notFound('User not found');
  
  // Check if email is being changed and if it's already in use (case-insensitive)
  if (updates.email && normalizeEmail(updates.email) !== normalizeEmail(user.email)) {
    const existing = await findUserByEmail(updates.email);
    if (existing) throw errors.conflict('Email already in use');
    user.email = normalizeEmail(updates.email);
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
  } catch (err: any) {
    if (err.code === 11000) {
      if (err.keyPattern?.email) throw errors.conflict('Email already in use');
      if (err.keyPattern?.phone) throw errors.conflict('Phone number already in use');
      throw errors.conflict('Duplicate value');
    }
    throw err;
  }
  
  logger.info({ userId }, 'profileService.updateUserProfile:success');
  
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

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  logger.info({ userId }, 'profileService.changePassword:start');
  
  const user = await User.findById(userId);
  if (!user) throw errors.notFound('User not found');
  
  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) throw errors.badRequest('Current password is incorrect');
  
  // Hash and update new password
  user.password = await hashPassword(newPassword);
  await user.save();
  
  logger.info({ userId }, 'profileService.changePassword:success');
  
  return { message: 'Password changed successfully' };
}

function mapOrderForProfile(order: {
  _id: { toString(): string };
  items: { productId?: { slug?: string }; name: string; price: number; quantity: number }[];
  total: number;
  status: string;
  address: string;
  phone: string;
  createdAt: Date;
}) {
  return {
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
  };
}

export async function getUserOrders(userId: string, options: { page: number; limit: number; q?: string }) {
  const { page, limit, q } = options;
  logger.info({ userId, page, limit, q }, 'profileService.getUserOrders:start');

  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = { userId };
  await applyOrderSearch(query, q);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .populate('items.productId', 'slug name price')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  logger.info({ userId, count: orders.length, total }, 'profileService.getUserOrders:success');

  return {
    orders: orders.map(mapOrderForProfile),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

