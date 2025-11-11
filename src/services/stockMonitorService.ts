import { Product } from '../models/Product';
import { logger } from '../lib/logger';
import { getSettingValue } from './settingsService';
import { sendAdminLowStockNotification } from './notificationService';

/**
 * Check inventory and send low stock alerts
 * This should be called periodically (e.g., daily via cron job)
 */
export async function checkLowStockAndNotify(): Promise<void> {
  try {
    logger.info('stockMonitorService.checkLowStock:start');

    // Check if low stock notifications are enabled
    const notificationsEnabled = await getSettingValue<boolean>('email_notifications_enabled', true);
    const lowStockEnabled = await getSettingValue<boolean>('email_low_stock_enabled', true);

    if (!notificationsEnabled || !lowStockEnabled) {
      logger.info('stockMonitorService.checkLowStock:disabled');
      return;
    }

    // Get threshold from settings
    const threshold = await getSettingValue<number>('low_stock_threshold', 5);

    // Find all published products with inventory tracking enabled and stock below threshold
    const lowStockProducts = await Product.find({
      published: true,
      'inventory.track': true,
      'inventory.stock': { $lte: threshold }
    }).select('name slug inventory');

    logger.info(
      { count: lowStockProducts.length, threshold },
      'stockMonitorService.checkLowStock:productsFound'
    );

    if (lowStockProducts.length === 0) {
      logger.info('stockMonitorService.checkLowStock:noLowStockProducts');
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
    await sendAdminLowStockNotification(productsData);

    logger.info(
      { count: lowStockProducts.length },
      'stockMonitorService.checkLowStock:notificationSent'
    );
  } catch (err) {
    logger.error({ err }, 'stockMonitorService.checkLowStock:error');
  }
}

