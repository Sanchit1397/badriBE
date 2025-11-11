import { sendMail } from '../lib/mail';
import { logger } from '../lib/logger';
import { getSettingValue } from './settingsService';
import { orderConfirmationEmail } from '../mail/templates/orderConfirmation';
import { orderStatusUpdateEmail } from '../mail/templates/orderStatusUpdate';
import { adminNewOrderEmail } from '../mail/templates/adminNewOrder';
import { adminLowStockEmail } from '../mail/templates/adminLowStock';
import type { IOrder } from '../models/Order';
import { User } from '../models/User';

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationNotification(order: IOrder): Promise<void> {
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await getSettingValue<boolean>('email_notifications_enabled', true);
    const orderConfirmationEnabled = await getSettingValue<boolean>('email_order_confirmation_enabled', true);

    if (!notificationsEnabled || !orderConfirmationEnabled) {
      logger.info({ orderId: order._id }, 'notificationService.orderConfirmation:disabled');
      return;
    }

    // Get user details
    const user = await User.findById(order.userId);
    if (!user) {
      logger.warn({ orderId: order._id }, 'notificationService.orderConfirmation:userNotFound');
      return;
    }

    // Get estimated delivery time from settings
    const estimatedDeliveryTime = await getSettingValue<string>('estimated_delivery_time', '30-45 minutes');

    // Prepare email data
    const emailData = {
      customerName: user.name,
      orderId: order._id.toString(),
      orderDate: new Date(order.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      address: order.address,
      phone: order.phone,
      estimatedDeliveryTime
    };

    const { subject, html } = orderConfirmationEmail(emailData);

    await sendMail({
      to: user.email,
      subject,
      html
    });

    logger.info({ orderId: order._id, email: user.email }, 'notificationService.orderConfirmation:sent');
  } catch (err) {
    logger.error({ err, orderId: order._id }, 'notificationService.orderConfirmation:error');
    // Don't throw - we don't want email failures to break order creation
  }
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusUpdateNotification(
  order: IOrder,
  status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
): Promise<void> {
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await getSettingValue<boolean>('email_notifications_enabled', true);
    const statusUpdateEnabled = await getSettingValue<boolean>('email_order_status_update_enabled', true);

    if (!notificationsEnabled || !statusUpdateEnabled) {
      logger.info({ orderId: order._id, status }, 'notificationService.statusUpdate:disabled');
      return;
    }

    // Only send for important status changes
    const importantStatuses = ['shipped', 'delivered'];
    if (!importantStatuses.includes(status)) {
      logger.info({ orderId: order._id, status }, 'notificationService.statusUpdate:skippedStatus');
      return;
    }

    // Get user details
    const user = await User.findById(order.userId);
    if (!user) {
      logger.warn({ orderId: order._id }, 'notificationService.statusUpdate:userNotFound');
      return;
    }

    const emailData = {
      customerName: user.name,
      orderId: order._id.toString(),
      status,
      total: order.total,
      address: order.address
    };

    const { subject, html } = orderStatusUpdateEmail(emailData);

    await sendMail({
      to: user.email,
      subject,
      html
    });

    logger.info({ orderId: order._id, email: user.email, status }, 'notificationService.statusUpdate:sent');
  } catch (err) {
    logger.error({ err, orderId: order._id, status }, 'notificationService.statusUpdate:error');
  }
}

/**
 * Send new order notification to admin
 */
export async function sendAdminNewOrderNotification(order: IOrder): Promise<void> {
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await getSettingValue<boolean>('email_notifications_enabled', true);
    const adminNewOrderEnabled = await getSettingValue<boolean>('email_admin_new_order_enabled', true);

    if (!notificationsEnabled || !adminNewOrderEnabled) {
      logger.info({ orderId: order._id }, 'notificationService.adminNewOrder:disabled');
      return;
    }

    // Get admin email from settings
    const adminEmail = await getSettingValue<string>('admin_notification_email', process.env.ADMIN_NOTIFICATION_EMAIL || '');
    
    if (!adminEmail) {
      logger.warn({ orderId: order._id }, 'notificationService.adminNewOrder:noAdminEmail');
      return;
    }

    // Get user details
    const user = await User.findById(order.userId);
    if (!user) {
      logger.warn({ orderId: order._id }, 'notificationService.adminNewOrder:userNotFound');
      return;
    }

    const emailData = {
      orderId: order._id.toString(),
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: order.phone,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      address: order.address,
      orderTime: new Date(order.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };

    const { subject, html } = adminNewOrderEmail(emailData);

    await sendMail({
      to: adminEmail,
      subject,
      html
    });

    logger.info({ orderId: order._id, adminEmail }, 'notificationService.adminNewOrder:sent');
  } catch (err) {
    logger.error({ err, orderId: order._id }, 'notificationService.adminNewOrder:error');
  }
}

/**
 * Send low stock alert to admin
 * This should be called by a cron job or scheduled task
 */
export async function sendAdminLowStockNotification(
  products: Array<{ name: string; slug: string; currentStock: number; threshold: number }>
): Promise<void> {
  try {
    if (products.length === 0) {
      logger.info('notificationService.lowStock:noProductsLowStock');
      return;
    }

    // Check if notifications are enabled
    const notificationsEnabled = await getSettingValue<boolean>('email_notifications_enabled', true);
    const lowStockEnabled = await getSettingValue<boolean>('email_low_stock_enabled', true);

    if (!notificationsEnabled || !lowStockEnabled) {
      logger.info({ productsCount: products.length }, 'notificationService.lowStock:disabled');
      return;
    }

    // Get admin email from settings
    const adminEmail = await getSettingValue<string>('admin_notification_email', process.env.ADMIN_NOTIFICATION_EMAIL || '');
    
    if (!adminEmail) {
      logger.warn('notificationService.lowStock:noAdminEmail');
      return;
    }

    const { subject, html } = adminLowStockEmail({ products });

    await sendMail({
      to: adminEmail,
      subject,
      html
    });

    logger.info({ adminEmail, productsCount: products.length }, 'notificationService.lowStock:sent');
  } catch (err) {
    logger.error({ err, productsCount: products.length }, 'notificationService.lowStock:error');
  }
}

