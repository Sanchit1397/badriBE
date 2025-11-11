"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetting = getSetting;
exports.getSettingValue = getSettingValue;
exports.getAllSettings = getAllSettings;
exports.getSettingsByCategory = getSettingsByCategory;
exports.updateSetting = updateSetting;
exports.createSetting = createSetting;
exports.deleteSetting = deleteSetting;
exports.preloadSettings = preloadSettings;
exports.clearCache = clearCache;
exports.getCacheStats = getCacheStats;
const Setting_1 = require("../models/Setting");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
// In-memory cache for settings
class SettingsCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutes
    }
    set(key, value) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.ttl
        });
    }
    get(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return cached.value;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    getAllKeys() {
        return Array.from(this.cache.keys());
    }
}
const cache = new SettingsCache();
/**
 * Get a single setting by key
 */
async function getSetting(key) {
    logger_1.logger.info({ key }, 'settingsService.getSetting:start');
    // Check cache first
    const cached = cache.get(key);
    if (cached) {
        logger_1.logger.info({ key, source: 'cache' }, 'settingsService.getSetting:cacheHit');
        return cached;
    }
    // Fetch from DB
    const setting = await Setting_1.Setting.findOne({ key });
    if (setting) {
        cache.set(key, setting);
        logger_1.logger.info({ key, source: 'db' }, 'settingsService.getSetting:success');
    }
    else {
        logger_1.logger.warn({ key }, 'settingsService.getSetting:notFound');
    }
    return setting;
}
/**
 * Get setting value directly (with type casting)
 */
async function getSettingValue(key, defaultValue) {
    const setting = await getSetting(key);
    return setting ? setting.value : defaultValue;
}
/**
 * Get all settings
 */
async function getAllSettings() {
    logger_1.logger.info('settingsService.getAllSettings:start');
    const settings = await Setting_1.Setting.find().sort({ category: 1, key: 1 });
    // Update cache
    settings.forEach((setting) => {
        cache.set(setting.key, setting);
    });
    logger_1.logger.info({ count: settings.length }, 'settingsService.getAllSettings:success');
    return settings;
}
/**
 * Get settings by category
 */
async function getSettingsByCategory(category) {
    logger_1.logger.info({ category }, 'settingsService.getSettingsByCategory:start');
    const settings = await Setting_1.Setting.find({ category }).sort({ key: 1 });
    // Update cache
    settings.forEach((setting) => {
        cache.set(setting.key, setting);
    });
    logger_1.logger.info({ category, count: settings.length }, 'settingsService.getSettingsByCategory:success');
    return settings;
}
/**
 * Update a setting
 */
async function updateSetting(key, value, updatedBy) {
    logger_1.logger.info({ key, updatedBy }, 'settingsService.updateSetting:start');
    const setting = await Setting_1.Setting.findOne({ key });
    if (!setting) {
        throw errors_1.errors.notFound(`Setting with key "${key}" not found`);
    }
    if (!setting.editable) {
        throw errors_1.errors.forbidden(`Setting "${key}" is not editable`);
    }
    // Validate type
    if (setting.type === 'number' && typeof value !== 'number') {
        throw errors_1.errors.badRequest(`Setting "${key}" must be a number`);
    }
    if (setting.type === 'boolean' && typeof value !== 'boolean') {
        throw errors_1.errors.badRequest(`Setting "${key}" must be a boolean`);
    }
    if (setting.type === 'string' && typeof value !== 'string') {
        throw errors_1.errors.badRequest(`Setting "${key}" must be a string`);
    }
    setting.value = value;
    if (updatedBy) {
        setting.updatedBy = updatedBy;
    }
    await setting.save();
    // Invalidate cache
    cache.delete(key);
    logger_1.logger.info({ key, newValue: value }, 'settingsService.updateSetting:success');
    return setting;
}
/**
 * Create a new setting
 */
async function createSetting(data) {
    logger_1.logger.info({ key: data.key }, 'settingsService.createSetting:start');
    const existing = await Setting_1.Setting.findOne({ key: data.key });
    if (existing) {
        throw errors_1.errors.conflict(`Setting with key "${data.key}" already exists`);
    }
    const setting = await Setting_1.Setting.create(data);
    // Add to cache
    cache.set(setting.key, setting);
    logger_1.logger.info({ key: data.key }, 'settingsService.createSetting:success');
    return setting;
}
/**
 * Delete a setting (admin only, use with caution)
 */
async function deleteSetting(key) {
    logger_1.logger.info({ key }, 'settingsService.deleteSetting:start');
    const setting = await Setting_1.Setting.findOne({ key });
    if (!setting) {
        throw errors_1.errors.notFound(`Setting with key "${key}" not found`);
    }
    if (!setting.editable) {
        throw errors_1.errors.forbidden(`Setting "${key}" cannot be deleted`);
    }
    await Setting_1.Setting.deleteOne({ key });
    // Remove from cache
    cache.delete(key);
    logger_1.logger.info({ key }, 'settingsService.deleteSetting:success');
}
/**
 * Preload all settings into cache (call on server startup)
 */
async function preloadSettings() {
    logger_1.logger.info('settingsService.preloadSettings:start');
    const settings = await Setting_1.Setting.find();
    settings.forEach((setting) => {
        cache.set(setting.key, setting);
    });
    logger_1.logger.info({ count: settings.length }, 'settingsService.preloadSettings:success');
}
/**
 * Clear cache (for testing or manual refresh)
 */
function clearCache() {
    cache.clear();
    logger_1.logger.info('settingsService.clearCache:success');
}
/**
 * Get cache stats (for monitoring)
 */
function getCacheStats() {
    const keys = cache.getAllKeys();
    return { keys, count: keys.length };
}
