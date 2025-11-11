import type { Request, Response } from 'express';
import { errors } from '../lib/errors';
import { withRequestContext } from '../lib/logger';
import {
  getAllSettings,
  getSetting,
  getSettingsByCategory,
  updateSetting,
  createSetting,
  deleteSetting,
  getCacheStats
} from '../services/settingsService';
import { z } from 'zod';

const updateSettingSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())])
});

const createSettingSchema = z.object({
  key: z.string().min(2).regex(/^[a-z_]+$/, 'Key must be lowercase with underscores only'),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]),
  type: z.enum(['string', 'number', 'boolean', 'json']),
  category: z.enum(['checkout', 'delivery', 'fees', 'loyalty', 'business', 'notifications']),
  label: z.string().min(2),
  description: z.string().optional(),
  editable: z.boolean().optional()
});

/**
 * GET /admin/settings
 * Get all settings
 */
export async function getAllSettingsCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('settings.getAll:start');

  const settings = await getAllSettings();

  log.info({ count: settings.length }, 'settings.getAll:success');
  return res.json({ settings });
}

/**
 * GET /admin/settings/:key
 * Get single setting by key
 */
export async function getSettingCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  const { key } = req.params;
  log.info({ key }, 'settings.get:start');

  const setting = await getSetting(key);
  if (!setting) {
    throw errors.notFound(`Setting with key "${key}" not found`);
  }

  log.info({ key }, 'settings.get:success');
  return res.json({ setting });
}

/**
 * GET /admin/settings/category/:category
 * Get settings by category
 */
export async function getSettingsByCategoryCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  const { category } = req.params;
  log.info({ category }, 'settings.getByCategory:start');

  const validCategories = ['checkout', 'delivery', 'fees', 'loyalty', 'business', 'notifications'];
  if (!validCategories.includes(category)) {
    throw errors.badRequest(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }

  const settings = await getSettingsByCategory(category as any);

  log.info({ category, count: settings.length }, 'settings.getByCategory:success');
  return res.json({ settings });
}

/**
 * PUT /admin/settings/:key
 * Update a setting
 */
export async function updateSettingCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  const { key } = req.params;
  log.info({ key }, 'settings.update:start');

  const parsed = updateSettingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw errors.unprocessable('Invalid data', parsed.error.flatten());
  }

  const userId = (req as any).user?.uid;
  const setting = await updateSetting(key, parsed.data.value, userId);

  log.info({ key, newValue: parsed.data.value }, 'settings.update:success');
  return res.json({ setting });
}

/**
 * POST /admin/settings
 * Create a new setting
 */
export async function createSettingCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('settings.create:start');

  const parsed = createSettingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw errors.unprocessable('Invalid data', parsed.error.flatten());
  }

  const setting = await createSetting(parsed.data);

  log.info({ key: parsed.data.key }, 'settings.create:success');
  return res.status(201).json({ setting });
}

/**
 * DELETE /admin/settings/:key
 * Delete a setting
 */
export async function deleteSettingCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  const { key } = req.params;
  log.info({ key }, 'settings.delete:start');

  await deleteSetting(key);

  log.info({ key }, 'settings.delete:success');
  return res.status(204).send();
}

/**
 * GET /admin/settings/cache/stats
 * Get cache statistics (for monitoring)
 */
export async function getCacheStatsCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('settings.getCacheStats:start');

  const stats = getCacheStats();

  log.info(stats, 'settings.getCacheStats:success');
  return res.json(stats);
}

