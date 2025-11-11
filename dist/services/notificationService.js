"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderConfirmationNotification = sendOrderConfirmationNotification;
exports.sendOrderStatusUpdateNotification = sendOrderStatusUpdateNotification;
exports.sendAdminNewOrderNotification = sendAdminNewOrderNotification;
exports.sendAdminLowStockNotification = sendAdminLowStockNotification;
const mail_1 = require("../lib/mail");
const logger_1 = require("../lib/logger");
const settingsService_1 = require("./settingsService");
const orderConfirmation_1 = require("../mail/templates/orderConfirmation");
const orderStatusUpdate_1 = require("../mail/templates/orderStatusUpdate");
const adminNewOrder_1 = require("../mail/templates/adminNewOrder");
const adminLowStock_1 = require("../mail/templates/adminLowStock");
const User_1 = require("../models/User");
/**
 * Send order confirmation email to customer
 */
async function sendOrderConfirmationNotification(order) {
    try {
        // Check if notifications are enabled
        const notificationsEnabled = await (0, settingsService_1.getSettingValue)('email_notifications_enabled', true);
        const orderConfirmationEnabled = await (0, settingsService_1.getSettingValue)('email_order_confirmation_enabled', true);
        if (!notificationsEnabled || !orderConfirmationEnabled) {
            logger_1.logger.info({ orderId: order._id }, 'notificationService.orderConfirmation:disabled');
            return;
        }
        // Get user details
        const user = await User_1.User.findById(order.userId);
        if (!user) {
            logger_1.logger.warn({ orderId: order._id }, 'notificationService.orderConfirmation:userNotFound');
            return;
        }
        // Get estimated delivery time from settings
        const estimatedDeliveryTime = await (0, settingsService_1.getSettingValue)('estimated_delivery_time', '30-45 minutes');
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
        const { subject, html } = (0, orderConfirmation_1.orderConfirmationEmail)(emailData);
        await (0, mail_1.sendMail)({
            to: user.email,
            subject,
            html
        });
        logger_1.logger.info({ orderId: order._id, email: user.email }, 'notificationService.orderConfirmation:sent');
    }
    catch (err) {
        logger_1.logger.error({ err, orderId: order._id }, 'notificationService.orderConfirmation:error');
        // Don't throw - we don't want email failures to break order creation
    }
}
/**
 * Send order status update email to customer
 */
async function sendOrderStatusUpdateNotification(order, status) {
    try {
        // Check if notifications are enabled
        const notificationsEnabled = await (0, settingsService_1.getSettingValue)('email_notifications_enabled', true);
        const statusUpdateEnabled = await (0, settingsService_1.getSettingValue)('email_order_status_update_enabled', true);
        if (!notificationsEnabled || !statusUpdateEnabled) {
            logger_1.logger.info({ orderId: order._id, status }, 'notificationService.statusUpdate:disabled');
            return;
        }
        // Only send for important status changes
        const importantStatuses = ['shipped', 'delivered'];
        if (!importantStatuses.includes(status)) {
            logger_1.logger.info({ orderId: order._id, status }, 'notificationService.statusUpdate:skippedStatus');
            return;
        }
        // Get user details
        const user = await User_1.User.findById(order.userId);
        if (!user) {
            logger_1.logger.warn({ orderId: order._id }, 'notificationService.statusUpdate:userNotFound');
            return;
        }
        const emailData = {
            customerName: user.name,
            orderId: order._id.toString(),
            status,
            total: order.total,
            address: order.address
        };
        const { subject, html } = (0, orderStatusUpdate_1.orderStatusUpdateEmail)(emailData);
        await (0, mail_1.sendMail)({
            to: user.email,
            subject,
            html
        });
        logger_1.logger.info({ orderId: order._id, email: user.email, status }, 'notificationService.statusUpdate:sent');
    }
    catch (err) {
        logger_1.logger.error({ err, orderId: order._id, status }, 'notificationService.statusUpdate:error');
    }
}
/**
 * Send new order notification to admin
 */
async function sendAdminNewOrderNotification(order) {
    try {
        // Check if notifications are enabled
        const notificationsEnabled = await (0, settingsService_1.getSettingValue)('email_notifications_enabled', true);
        const adminNewOrderEnabled = await (0, settingsService_1.getSettingValue)('email_admin_new_order_enabled', true);
        if (!notificationsEnabled || !adminNewOrderEnabled) {
            logger_1.logger.info({ orderId: order._id }, 'notificationService.adminNewOrder:disabled');
            return;
        }
        // Get admin email from settings
        const adminEmail = await (0, settingsService_1.getSettingValue)('admin_notification_email', process.env.ADMIN_NOTIFICATION_EMAIL || '');
        if (!adminEmail) {
            logger_1.logger.warn({ orderId: order._id }, 'notificationService.adminNewOrder:noAdminEmail');
            return;
        }
        // Get user details
        const user = await User_1.User.findById(order.userId);
        if (!user) {
            logger_1.logger.warn({ orderId: order._id }, 'notificationService.adminNewOrder:userNotFound');
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
        const { subject, html } = (0, adminNewOrder_1.adminNewOrderEmail)(emailData);
        await (0, mail_1.sendMail)({
            to: adminEmail,
            subject,
            html
        });
        logger_1.logger.info({ orderId: order._id, adminEmail }, 'notificationService.adminNewOrder:sent');
    }
    catch (err) {
        logger_1.logger.error({ err, orderId: order._id }, 'notificationService.adminNewOrder:error');
    }
}
/**
 * Send low stock alert to admin
 * This should be called by a cron job or scheduled task
 */
async function sendAdminLowStockNotification(products) {
    try {
        if (products.length === 0) {
            logger_1.logger.info('notificationService.lowStock:noProductsLowStock');
            return;
        }
        // Check if notifications are enabled
        const notificationsEnabled = await (0, settingsService_1.getSettingValue)('email_notifications_enabled', true);
        const lowStockEnabled = await (0, settingsService_1.getSettingValue)('email_low_stock_enabled', true);
        if (!notificationsEnabled || !lowStockEnabled) {
            logger_1.logger.info({ productsCount: products.length }, 'notificationService.lowStock:disabled');
            return;
        }
        // Get admin email from settings
        const adminEmail = await (0, settingsService_1.getSettingValue)('admin_notification_email', process.env.ADMIN_NOTIFICATION_EMAIL || '');
        if (!adminEmail) {
            logger_1.logger.warn('notificationService.lowStock:noAdminEmail');
            return;
        }
        const { subject, html } = (0, adminLowStock_1.adminLowStockEmail)({ products });
        await (0, mail_1.sendMail)({
            to: adminEmail,
            subject,
            html
        });
        logger_1.logger.info({ adminEmail, productsCount: products.length }, 'notificationService.lowStock:sent');
    }
    catch (err) {
        logger_1.logger.error({ err, productsCount: products.length }, 'notificationService.lowStock:error');
    }
}
