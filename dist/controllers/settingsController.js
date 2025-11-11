"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSettingsCtrl = getAllSettingsCtrl;
exports.getSettingCtrl = getSettingCtrl;
exports.getSettingsByCategoryCtrl = getSettingsByCategoryCtrl;
exports.updateSettingCtrl = updateSettingCtrl;
exports.createSettingCtrl = createSettingCtrl;
exports.deleteSettingCtrl = deleteSettingCtrl;
exports.getCacheStatsCtrl = getCacheStatsCtrl;
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const settingsService_1 = require("../services/settingsService");
const zod_1 = require("zod");
const updateSettingSchema = zod_1.z.object({
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.record(zod_1.z.any())])
});
const createSettingSchema = zod_1.z.object({
    key: zod_1.z.string().min(2).regex(/^[a-z_]+$/, 'Key must be lowercase with underscores only'),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.record(zod_1.z.any())]),
    type: zod_1.z.enum(['string', 'number', 'boolean', 'json']),
    category: zod_1.z.enum(['checkout', 'delivery', 'fees', 'loyalty', 'business', 'notifications']),
    label: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    editable: zod_1.z.boolean().optional()
});
/**
 * GET /admin/settings
 * Get all settings
 */
async function getAllSettingsCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('settings.getAll:start');
    const settings = await (0, settingsService_1.getAllSettings)();
    log.info({ count: settings.length }, 'settings.getAll:success');
    return res.json({ settings });
}
/**
 * GET /admin/settings/:key
 * Get single setting by key
 */
async function getSettingCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    const { key } = req.params;
    log.info({ key }, 'settings.get:start');
    const setting = await (0, settingsService_1.getSetting)(key);
    if (!setting) {
        throw errors_1.errors.notFound(`Setting with key "${key}" not found`);
    }
    log.info({ key }, 'settings.get:success');
    return res.json({ setting });
}
/**
 * GET /admin/settings/category/:category
 * Get settings by category
 */
async function getSettingsByCategoryCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    const { category } = req.params;
    log.info({ category }, 'settings.getByCategory:start');
    const validCategories = ['checkout', 'delivery', 'fees', 'loyalty', 'business', 'notifications'];
    if (!validCategories.includes(category)) {
        throw errors_1.errors.badRequest(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    const settings = await (0, settingsService_1.getSettingsByCategory)(category);
    log.info({ category, count: settings.length }, 'settings.getByCategory:success');
    return res.json({ settings });
}
/**
 * PUT /admin/settings/:key
 * Update a setting
 */
async function updateSettingCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    const { key } = req.params;
    log.info({ key }, 'settings.update:start');
    const parsed = updateSettingSchema.safeParse(req.body);
    if (!parsed.success) {
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    }
    const userId = req.user?.uid;
    const setting = await (0, settingsService_1.updateSetting)(key, parsed.data.value, userId);
    log.info({ key, newValue: parsed.data.value }, 'settings.update:success');
    return res.json({ setting });
}
/**
 * POST /admin/settings
 * Create a new setting
 */
async function createSettingCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('settings.create:start');
    const parsed = createSettingSchema.safeParse(req.body);
    if (!parsed.success) {
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    }
    const setting = await (0, settingsService_1.createSetting)(parsed.data);
    log.info({ key: parsed.data.key }, 'settings.create:success');
    return res.status(201).json({ setting });
}
/**
 * DELETE /admin/settings/:key
 * Delete a setting
 */
async function deleteSettingCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    const { key } = req.params;
    log.info({ key }, 'settings.delete:start');
    await (0, settingsService_1.deleteSetting)(key);
    log.info({ key }, 'settings.delete:success');
    return res.status(204).send();
}
/**
 * GET /admin/settings/cache/stats
 * Get cache statistics (for monitoring)
 */
async function getCacheStatsCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('settings.getCacheStats:start');
    const stats = (0, settingsService_1.getCacheStats)();
    log.info(stats, 'settings.getCacheStats:success');
    return res.json(stats);
}
