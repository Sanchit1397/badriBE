import { Setting, type ISetting, type SettingCategory } from '../models/Setting';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';

// In-memory cache for settings
class SettingsCache {
  private cache: Map<string, { value: ISetting; expiresAt: number }> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: ISetting): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    });
  }

  get(key: string): ISetting | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

const cache = new SettingsCache();

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<ISetting | null> {
  logger.info({ key }, 'settingsService.getSetting:start');

  // Check cache first
  const cached = cache.get(key);
  if (cached) {
    logger.info({ key, source: 'cache' }, 'settingsService.getSetting:cacheHit');
    return cached;
  }

  // Fetch from DB
  const setting = await Setting.findOne({ key });
  if (setting) {
    cache.set(key, setting);
    logger.info({ key, source: 'db' }, 'settingsService.getSetting:success');
  } else {
    logger.warn({ key }, 'settingsService.getSetting:notFound');
  }

  return setting;
}

/**
 * Get setting value directly (with type casting)
 */
export async function getSettingValue<T = any>(key: string, defaultValue?: T): Promise<T> {
  const setting = await getSetting(key);
  return setting ? (setting.value as T) : (defaultValue as T);
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<ISetting[]> {
  logger.info('settingsService.getAllSettings:start');
  const settings = await Setting.find().sort({ category: 1, key: 1 });
  
  // Update cache
  settings.forEach((setting) => {
    cache.set(setting.key, setting);
  });
  
  logger.info({ count: settings.length }, 'settingsService.getAllSettings:success');
  return settings;
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(category: SettingCategory): Promise<ISetting[]> {
  logger.info({ category }, 'settingsService.getSettingsByCategory:start');
  const settings = await Setting.find({ category }).sort({ key: 1 });
  
  // Update cache
  settings.forEach((setting) => {
    cache.set(setting.key, setting);
  });
  
  logger.info({ category, count: settings.length }, 'settingsService.getSettingsByCategory:success');
  return settings;
}

/**
 * Update a setting
 */
export async function updateSetting(
  key: string,
  value: string | number | boolean | object,
  updatedBy?: string
): Promise<ISetting> {
  logger.info({ key, updatedBy }, 'settingsService.updateSetting:start');

  const setting = await Setting.findOne({ key });
  if (!setting) {
    throw errors.notFound(`Setting with key "${key}" not found`);
  }

  if (!setting.editable) {
    throw errors.forbidden(`Setting "${key}" is not editable`);
  }

  // Validate type
  if (setting.type === 'number' && typeof value !== 'number') {
    throw errors.badRequest(`Setting "${key}" must be a number`);
  }
  if (setting.type === 'boolean' && typeof value !== 'boolean') {
    throw errors.badRequest(`Setting "${key}" must be a boolean`);
  }
  if (setting.type === 'string' && typeof value !== 'string') {
    throw errors.badRequest(`Setting "${key}" must be a string`);
  }

  setting.value = value;
  if (updatedBy) {
    setting.updatedBy = updatedBy as any;
  }

  await setting.save();

  // Invalidate cache
  cache.delete(key);
  
  logger.info({ key, newValue: value }, 'settingsService.updateSetting:success');
  return setting;
}

/**
 * Create a new setting
 */
export async function createSetting(data: {
  key: string;
  value: string | number | boolean | object;
  type: ISetting['type'];
  category: SettingCategory;
  label: string;
  description?: string;
  editable?: boolean;
}): Promise<ISetting> {
  logger.info({ key: data.key }, 'settingsService.createSetting:start');

  const existing = await Setting.findOne({ key: data.key });
  if (existing) {
    throw errors.conflict(`Setting with key "${data.key}" already exists`);
  }

  const setting = await Setting.create(data);
  
  // Add to cache
  cache.set(setting.key, setting);
  
  logger.info({ key: data.key }, 'settingsService.createSetting:success');
  return setting;
}

/**
 * Delete a setting (admin only, use with caution)
 */
export async function deleteSetting(key: string): Promise<void> {
  logger.info({ key }, 'settingsService.deleteSetting:start');

  const setting = await Setting.findOne({ key });
  if (!setting) {
    throw errors.notFound(`Setting with key "${key}" not found`);
  }

  if (!setting.editable) {
    throw errors.forbidden(`Setting "${key}" cannot be deleted`);
  }

  await Setting.deleteOne({ key });
  
  // Remove from cache
  cache.delete(key);
  
  logger.info({ key }, 'settingsService.deleteSetting:success');
}

/**
 * Preload all settings into cache (call on server startup)
 */
export async function preloadSettings(): Promise<void> {
  logger.info('settingsService.preloadSettings:start');
  const settings = await Setting.find();
  
  settings.forEach((setting) => {
    cache.set(setting.key, setting);
  });
  
  logger.info({ count: settings.length }, 'settingsService.preloadSettings:success');
}

/**
 * Clear cache (for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
  logger.info('settingsService.clearCache:success');
}

/**
 * Get cache stats (for monitoring)
 */
export function getCacheStats(): { keys: string[]; count: number } {
  const keys = cache.getAllKeys();
  return { keys, count: keys.length };
}

