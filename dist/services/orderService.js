"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCodOrder = createCodOrder;
exports.getOrderById = getOrderById;
const mongoose_1 = require("mongoose");
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const settingsService_1 = require("./settingsService");
const notificationService_1 = require("./notificationService");
async function createCodOrder(input) {
    logger_1.logger.info({ itemCount: input.items.length, userId: input.userId }, 'orderService.createCodOrder:start');
    // Fetch products by slug
    const slugs = input.items.map((i) => i.slug);
    logger_1.logger.info({ slugs }, 'orderService.createCodOrder:fetchingProducts');
    const products = await Product_1.Product.find({ slug: { $in: slugs } });
    logger_1.logger.info({ foundCount: products.length, expectedCount: input.items.length }, 'orderService.createCodOrder:productsFound');
    if (products.length !== input.items.length) {
        const missingProducts = slugs.filter(slug => !products.find(p => p.slug === slug));
        logger_1.logger.error({ missingProducts }, 'orderService.createCodOrder:productsNotFound');
        throw errors_1.errors.badRequest(`Products not found: ${missingProducts.join(', ')}`);
    }
    // Build items with current prices; validate inventory if tracking is enabled
    const items = input.items.map((i) => {
        const p = products.find((pp) => pp.slug === i.slug);
        if (p.inventory?.track && p.inventory.stock < i.quantity)
            throw errors_1.errors.badRequest(`Insufficient stock for ${p.name}`);
        return { productId: p._id, name: p.name, price: p.price, quantity: i.quantity };
    });
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    // Check minimum order value
    const minimumOrderValue = await (0, settingsService_1.getSettingValue)('minimum_order_value', 0);
    if (minimumOrderValue > 0 && subtotal < minimumOrderValue) {
        logger_1.logger.warn({ subtotal, minimumOrderValue }, 'orderService.createCodOrder:belowMinimum');
        throw errors_1.errors.badRequest(`Order total must be at least ₹${minimumOrderValue}. Current subtotal: ₹${subtotal}`);
    }
    const total = subtotal + input.deliveryFee;
    logger_1.logger.info({ subtotal, deliveryFee: input.deliveryFee, total, itemCount: items.length, minimumOrderValue }, 'orderService.createCodOrder:creatingOrder');
    const order = await Order_1.Order.create({
        userId: new mongoose_1.Types.ObjectId(input.userId),
        items,
        subtotal,
        deliveryFee: input.deliveryFee,
        total,
        address: input.address,
        phone: input.phone,
        status: 'placed'
    });
    logger_1.logger.info({ orderId: order._id.toString(), userId: input.userId, total }, 'orderService.createCodOrder:orderCreated');
    // Decrement inventory if tracked
    for (const i of input.items) {
        const p = products.find((pp) => pp.slug === i.slug);
        if (p.inventory?.track) {
            p.inventory.stock = Math.max(0, (p.inventory.stock || 0) - i.quantity);
            await p.save();
            logger_1.logger.info({ productSlug: p.slug, newStock: p.inventory.stock }, 'orderService.createCodOrder:inventoryUpdated');
        }
    }
    // Send email notifications (non-blocking)
    // We don't await these to avoid delaying the order response
    (0, notificationService_1.sendOrderConfirmationNotification)(order).catch((err) => logger_1.logger.error({ err, orderId: order._id }, 'orderService.createCodOrder:confirmationEmailFailed'));
    (0, notificationService_1.sendAdminNewOrderNotification)(order).catch((err) => logger_1.logger.error({ err, orderId: order._id }, 'orderService.createCodOrder:adminNotificationFailed'));
    logger_1.logger.info({ orderId: order._id.toString() }, 'orderService.createCodOrder:success');
    return order;
}
async function getOrderById(orderId, userId) {
    logger_1.logger.info({ orderId }, 'orderService.getOrderById:start');
    // Validate ObjectId format
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw errors_1.errors.badRequest('Invalid order ID');
    }
    const order = await Order_1.Order.findById(orderId).populate('items.productId', 'slug name price');
    if (!order)
        throw errors_1.errors.notFound('Order not found');
    // Ensure user can only access their own orders
    if (order.userId.toString() !== userId) {
        throw errors_1.errors.forbidden('You can only view your own orders');
    }
    logger_1.logger.info({ orderId }, 'orderService.getOrderById:success');
    // Transform the response to match frontend expectations
    return {
        _id: order._id.toString(),
        items: order.items.map((item) => ({
            product: {
                slug: item.productId?.slug || 'unknown',
                name: item.name,
                price: item.price,
            },
            quantity: item.quantity,
            price: item.price * item.quantity,
        })),
        deliveryFee: order.deliveryFee,
        total: order.total,
        status: order.status,
        address: order.address,
        phone: order.phone,
        createdAt: order.createdAt,
    };
}
