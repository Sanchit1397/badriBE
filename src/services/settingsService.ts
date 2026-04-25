import { Setting, type ISetting, type SettingCategory } from '../models/Setting';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';

type DefaultSettingInput = {
  key: string;
  value: string | number | boolean | object;
  type: ISetting['type'];
  category: SettingCategory;
  label: string;
  description?: string;
  editable: boolean;
};

const DEFAULT_SETTINGS: DefaultSettingInput[] = [
  { key: 'minimum_order_value', value: 0, type: 'number', category: 'checkout', label: 'Minimum Order Value (₹)', description: 'Minimum cart subtotal required for checkout (excluding delivery fee). Set to 0 to disable.', editable: true },
  { key: 'max_items_per_order', value: 50, type: 'number', category: 'checkout', label: 'Maximum Items Per Order', description: 'Maximum number of items allowed in a single order', editable: true },
  { key: 'delivery_base_fee', value: 50, type: 'number', category: 'delivery', label: 'Base Delivery Fee (₹)', description: 'Standard delivery charge for all orders', editable: true },
  { key: 'free_delivery_threshold', value: 500, type: 'number', category: 'delivery', label: 'Free Delivery Above (₹)', description: 'Cart value above which delivery is free. Set to 0 to disable free delivery.', editable: true },
  { key: 'estimated_delivery_time', value: '30-45 minutes', type: 'string', category: 'delivery', label: 'Estimated Delivery Time', description: 'Default delivery time estimate shown to customers', editable: true },
  { key: 'surge_fee_enabled', value: false, type: 'boolean', category: 'fees', label: 'Enable Surge Pricing', description: 'Charge extra during high-demand periods', editable: true },
  { key: 'surge_fee_percentage', value: 20, type: 'number', category: 'fees', label: 'Surge Fee Percentage (%)', description: 'Additional charge percentage during surge hours', editable: true },
  { key: 'late_night_fee_enabled', value: false, type: 'boolean', category: 'fees', label: 'Enable Late Night Fee', description: 'Charge extra for late night orders', editable: true },
  { key: 'late_night_fee', value: 30, type: 'number', category: 'fees', label: 'Late Night Fee (₹)', description: 'Additional charge for late night orders', editable: true },
  { key: 'late_night_start_hour', value: 22, type: 'number', category: 'fees', label: 'Late Night Start Hour', description: 'Hour when late night fee starts (24-hour format)', editable: true },
  { key: 'late_night_end_hour', value: 6, type: 'number', category: 'fees', label: 'Late Night End Hour', description: 'Hour when late night fee ends (24-hour format)', editable: true },
  { key: 'store_name', value: 'BadrikiDukaan', type: 'string', category: 'business', label: 'Store Name', description: 'Your store name displayed to customers', editable: true },
  { key: 'store_phone', value: '', type: 'string', category: 'business', label: 'Store Phone Number', description: 'Customer support phone number', editable: true },
  { key: 'store_email', value: '', type: 'string', category: 'business', label: 'Store Email', description: 'Customer support email address', editable: true },
  { key: 'store_address', value: '', type: 'string', category: 'business', label: 'Store Address', description: 'Physical store address', editable: true },
  { key: 'loyalty_points_enabled', value: false, type: 'boolean', category: 'loyalty', label: 'Enable Loyalty Points', description: 'Reward customers with points for purchases', editable: true },
  { key: 'loyalty_points_per_100', value: 1, type: 'number', category: 'loyalty', label: 'Points Per ₹100 Spent', description: 'How many points customers earn per ₹100 spent', editable: true },
  { key: 'loyalty_points_value', value: 1, type: 'number', category: 'loyalty', label: 'Point Value (₹)', description: 'How much each loyalty point is worth in rupees', editable: true },
  { key: 'email_notifications_enabled', value: true, type: 'boolean', category: 'notifications', label: 'Enable Email Notifications', description: 'Master toggle for all email notifications. Turn off to disable all emails.', editable: true },
  { key: 'email_order_confirmation_enabled', value: true, type: 'boolean', category: 'notifications', label: 'Order Confirmation Emails', description: 'Send confirmation email to customer when order is placed', editable: true },
  { key: 'email_order_status_update_enabled', value: true, type: 'boolean', category: 'notifications', label: 'Order Status Update Emails', description: 'Notify customers when order status changes (shipped, delivered)', editable: true },
  { key: 'email_admin_new_order_enabled', value: true, type: 'boolean', category: 'notifications', label: 'Admin New Order Alerts', description: 'Notify admin when a new order is placed', editable: true },
  { key: 'email_low_stock_enabled', value: true, type: 'boolean', category: 'notifications', label: 'Low Stock Alerts', description: 'Notify admin when products are running low on stock', editable: true },
  { key: 'admin_notification_email', value: '', type: 'string', category: 'notifications', label: 'Admin Notification Email', description: 'Email address to receive admin notifications (new orders, low stock alerts)', editable: true },
  { key: 'low_stock_threshold', value: 5, type: 'number', category: 'notifications', label: 'Low Stock Threshold', description: 'Send alert when product stock falls below this number', editable: true }
];

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

/**
 * Seed missing default settings. Safe to run multiple times.
 */
export async function seedMissingDefaultSettings(): Promise<{ created: number; skipped: number; total: number }> {
  logger.info('settingsService.seedMissingDefaultSettings:start');
  let created = 0;
  let skipped = 0;

  for (const settingData of DEFAULT_SETTINGS) {
    const existing = await Setting.findOne({ key: settingData.key });
    if (existing) {
      skipped += 1;
      continue;
    }
    const setting = await Setting.create(settingData);
    cache.set(setting.key, setting);
    created += 1;
  }

  logger.info({ created, skipped, total: DEFAULT_SETTINGS.length }, 'settingsService.seedMissingDefaultSettings:success');
  return { created, skipped, total: DEFAULT_SETTINGS.length };
}

