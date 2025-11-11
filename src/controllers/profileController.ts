import type { Request, Response } from 'express';
import { errors } from '../lib/errors';
import { withRequestContext } from '../lib/logger';
import { updateProfileSchema, changePasswordSchema } from '../validators/profile';
import { getUserProfile, updateUserProfile, changeUserPassword, getUserOrders } from '../services/profileService';

export async function getUserProfileCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('profile.get:start');
  
  const userId = (req as any).user?.uid;
  if (!userId) throw errors.unauthorized();
  
  const profile = await getUserProfile(userId);
  log.info({ userId }, 'profile.get:success');
  
  return res.json({ profile });
}

export async function updateUserProfileCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('profile.update:start');
  
  const userId = (req as any).user?.uid;
  if (!userId) throw errors.unauthorized();
  
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  
  const profile = await updateUserProfile(userId, parsed.data);
  log.info({ userId }, 'profile.update:success');
  
  return res.json({ profile });
}

export async function changePasswordCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('profile.changePassword:start');
  
  const userId = (req as any).user?.uid;
  if (!userId) throw errors.unauthorized();
  
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  
  const result = await changeUserPassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
  log.info({ userId }, 'profile.changePassword:success');
  
  return res.json(result);
}

export async function getUserOrdersCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('profile.orders:start');
  
  const userId = (req as any).user?.uid;
  if (!userId) throw errors.unauthorized();
  
  const orders = await getUserOrders(userId);
  log.info({ userId, count: orders.length }, 'profile.orders:success');
  
  return res.json({ orders });
}

