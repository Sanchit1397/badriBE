import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';
import { sendOrderStatusUpdateNotification } from './notificationService';

interface GetOrdersOptions {
  status?: string;
  limit: number;
  page: number;
}

export async function getAllOrders(options: GetOrdersOptions) {
  logger.info({ options }, 'adminOrderService.getAllOrders:start');
  
  const { status, limit, page } = options;
  const skip = (page - 1) * limit;
  
  // Build query
  const query: any = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  
  // Fetch orders with user details
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('userId', 'name email')
      .populate('items.productId', 'slug name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);
  
  logger.info({ count: orders.length, total }, 'adminOrderService.getAllOrders:success');
  
  // Transform response
  return {
    orders: orders.map(order => ({
      _id: order._id.toString(),
      user: {
        name: (order.userId as any)?.name || 'Unknown',
        email: (order.userId as any)?.email || 'Unknown'
      },
      items: order.items.map((item: any) => ({
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

export async function getOrderByIdAdmin(orderId: string) {
  logger.info({ orderId }, 'adminOrderService.getOrderById:start');
  
  if (!Types.ObjectId.isValid(orderId)) {
    throw errors.badRequest('Invalid order ID');
  }

  const order = await Order.findById(orderId)
    .populate('userId', 'name email')
    .populate('items.productId', 'slug name price');
  
  if (!order) throw errors.notFound('Order not found');
  
  logger.info({ orderId }, 'adminOrderService.getOrderById:success');
  
  // Transform the response
  return {
    _id: order._id.toString(),
    user: {
      name: (order.userId as any)?.name || 'Unknown',
      email: (order.userId as any)?.email || 'Unknown'
    },
    items: order.items.map((item: any) => ({
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

export async function updateOrderStatus(orderId: string, status: string) {
  logger.info({ orderId, status }, 'adminOrderService.updateStatus:start');
  
  if (!Types.ObjectId.isValid(orderId)) {
    throw errors.badRequest('Invalid order ID');
  }
  
  const order = await Order.findById(orderId);
  if (!order) throw errors.notFound('Order not found');
  
  const oldStatus = order.status;
  order.status = status as any;
  await order.save();
  
  logger.info({ orderId, oldStatus, newStatus: status }, 'adminOrderService.updateStatus:success');
  
  // Send status update notification (only for important statuses)
  if (['shipped', 'delivered'].includes(status)) {
    sendOrderStatusUpdateNotification(order, status as any).catch((err) =>
      logger.error({ err, orderId }, 'adminOrderService.updateStatus:notificationFailed')
    );
  }
  
  return {
    _id: order._id.toString(),
    status: order.status,
    updatedAt: order.updatedAt
  };
}

