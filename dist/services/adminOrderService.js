"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.getOrderByIdAdmin = getOrderByIdAdmin;
exports.updateOrderStatus = updateOrderStatus;
const mongoose_1 = require("mongoose");
const Order_1 = require("../models/Order");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const notificationService_1 = require("./notificationService");
async function getAllOrders(options) {
    logger_1.logger.info({ options }, 'adminOrderService.getAllOrders:start');
    const { status, limit, page } = options;
    const skip = (page - 1) * limit;
    // Build query
    const query = {};
    if (status && status !== 'all') {
        query.status = status;
    }
    // Fetch orders with user details
    const [orders, total] = await Promise.all([
        Order_1.Order.find(query)
            .populate('userId', 'name email')
            .populate('items.productId', 'slug name price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Order_1.Order.countDocuments(query)
    ]);
    logger_1.logger.info({ count: orders.length, total }, 'adminOrderService.getAllOrders:success');
    // Transform response
    return {
        orders: orders.map(order => ({
            _id: order._id.toString(),
            user: {
                name: order.userId?.name || 'Unknown',
                email: order.userId?.email || 'Unknown'
            },
            items: order.items.map((item) => ({
                product: {
                    slug: item.productId?.slug || 'unknown',
                    name: item.name,
                    price: item.price
                },
                quantity: item.quantity,
                price: item.price * item.quantity
            })),
            total: order.total,
            status: order.status,
            address: order.address,
            phone: order.phone,
            createdAt: order.createdAt
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
async function getOrderByIdAdmin(orderId) {
    logger_1.logger.info({ orderId }, 'adminOrderService.getOrderById:start');
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw errors_1.errors.badRequest('Invalid order ID');
    }
    const order = await Order_1.Order.findById(orderId)
        .populate('userId', 'name email')
        .populate('items.productId', 'slug name price');
    if (!order)
        throw errors_1.errors.notFound('Order not found');
    logger_1.logger.info({ orderId }, 'adminOrderService.getOrderById:success');
    // Transform the response
    return {
        _id: order._id.toString(),
        user: {
            name: order.userId?.name || 'Unknown',
            email: order.userId?.email || 'Unknown'
        },
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
async function updateOrderStatus(orderId, status) {
    logger_1.logger.info({ orderId, status }, 'adminOrderService.updateStatus:start');
    if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
        throw errors_1.errors.badRequest('Invalid order ID');
    }
    const order = await Order_1.Order.findById(orderId);
    if (!order)
        throw errors_1.errors.notFound('Order not found');
    const oldStatus = order.status;
    order.status = status;
    await order.save();
    logger_1.logger.info({ orderId, oldStatus, newStatus: status }, 'adminOrderService.updateStatus:success');
    // Send status update notification (only for important statuses)
    if (['shipped', 'delivered'].includes(status)) {
        (0, notificationService_1.sendOrderStatusUpdateNotification)(order, status).catch((err) => logger_1.logger.error({ err, orderId }, 'adminOrderService.updateStatus:notificationFailed'));
    }
    return {
        _id: order._id.toString(),
        status: order.status,
        updatedAt: order.updatedAt
    };
}
