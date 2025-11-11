"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLowStockAndNotify = checkLowStockAndNotify;
const Product_1 = require("../models/Product");
const logger_1 = require("../lib/logger");
const settingsService_1 = require("./settingsService");
const notificationService_1 = require("./notificationService");
/**
 * Check inventory and send low stock alerts
 * This should be called periodically (e.g., daily via cron job)
 */
async function checkLowStockAndNotify() {
    try {
        logger_1.logger.info('stockMonitorService.checkLowStock:start');
        // Check if low stock notifications are enabled
        const notificationsEnabled = await (0, settingsService_1.getSettingValue)('email_notifications_enabled', true);
        const lowStockEnabled = await (0, settingsService_1.getSettingValue)('email_low_stock_enabled', true);
        if (!notificationsEnabled || !lowStockEnabled) {
            logger_1.logger.info('stockMonitorService.checkLowStock:disabled');
            return;
        }
        // Get threshold from settings
        const threshold = await (0, settingsService_1.getSettingValue)('low_stock_threshold', 5);
        // Find all published products with inventory tracking enabled and stock below threshold
        const lowStockProducts = await Product_1.Product.find({
            published: true,
            'inventory.track': true,
            'inventory.stock': { $lte: threshold }
        }).select('name slug inventory');
        logger_1.logger.info({ count: lowStockProducts.length, threshold }, 'stockMonitorService.checkLowStock:productsFound');
        if (lowStockProducts.length === 0) {
            logger_1.logger.info('stockMonitorService.checkLowStock:noLowStockProducts');
            return;
        }
        // Prepare data for email
        const productsData = lowStockProducts.map((p) => ({
            name: p.name,
            slug: p.slug,
            currentStock: p.inventory?.stock || 0,
            threshold
        }));
        // Send notification
        await (0, notificationService_1.sendAdminLowStockNotification)(productsData);
        logger_1.logger.info({ count: lowStockProducts.length }, 'stockMonitorService.checkLowStock:notificationSent');
    }
    catch (err) {
        logger_1.logger.error({ err }, 'stockMonitorService.checkLowStock:error');
    }
}
