import { Types } from 'mongoose';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';
import { getSettingValue } from './settingsService';
import { sendOrderConfirmationNotification, sendAdminNewOrderNotification } from './notificationService';

interface CreateOrderInput {
  userId: string;
  items: { slug: string; quantity: number }[];
  deliveryFee: number;
  address: string;
  phone: string;
}

export async function createCodOrder(input: CreateOrderInput) {
  logger.info({ itemCount: input.items.length, userId: input.userId }, 'orderService.createCodOrder:start');
  // Fetch products by slug
  const slugs = input.items.map((i) => i.slug);
  logger.info({ slugs }, 'orderService.createCodOrder:fetchingProducts');
  const products = await Product.find({ slug: { $in: slugs } });
  logger.info({ foundCount: products.length, expectedCount: input.items.length }, 'orderService.createCodOrder:productsFound');
  if (products.length !== input.items.length) {
    const missingProducts = slugs.filter(slug => !products.find(p => p.slug === slug));
    logger.error({ missingProducts }, 'orderService.createCodOrder:productsNotFound');
    throw errors.badRequest(`Products not found: ${missingProducts.join(', ')}`);
  }

  // Build items with current prices; validate inventory if tracking is enabled
  const items = input.items.map((i) => {
    const p = products.find((pp) => pp.slug === i.slug)!;
    if (p.inventory?.track && p.inventory.stock < i.quantity) throw errors.badRequest(`Insufficient stock for ${p.name}`);
    return { productId: p._id, name: p.name, price: p.price, quantity: i.quantity };
  });

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  
  // Check minimum order value
  const minimumOrderValue = await getSettingValue<number>('minimum_order_value', 0);
  if (minimumOrderValue > 0 && subtotal < minimumOrderValue) {
    logger.warn({ subtotal, minimumOrderValue }, 'orderService.createCodOrder:belowMinimum');
    throw errors.badRequest(`Order total must be at least ₹${minimumOrderValue}. Current subtotal: ₹${subtotal}`);
  }
  
  const total = subtotal + input.deliveryFee;

  logger.info({ subtotal, deliveryFee: input.deliveryFee, total, itemCount: items.length, minimumOrderValue }, 'orderService.createCodOrder:creatingOrder');
  
  const order = await Order.create({
    userId: new Types.ObjectId(input.userId),
    items,
    subtotal,
    deliveryFee: input.deliveryFee,
    total,
    address: input.address,
    phone: input.phone,
    status: 'placed'
  });

  logger.info({ orderId: order._id.toString(), userId: input.userId, total }, 'orderService.createCodOrder:orderCreated');

  // Decrement inventory if tracked
  for (const i of input.items) {
    const p = products.find((pp) => pp.slug === i.slug)!;
    if (p.inventory?.track) {
      p.inventory.stock = Math.max(0, (p.inventory.stock || 0) - i.quantity);
      await p.save();
      logger.info({ productSlug: p.slug, newStock: p.inventory.stock }, 'orderService.createCodOrder:inventoryUpdated');
    }
  }

  // Send email notifications (non-blocking)
  // We don't await these to avoid delaying the order response
  sendOrderConfirmationNotification(order).catch((err) =>
    logger.error({ err, orderId: order._id }, 'orderService.createCodOrder:confirmationEmailFailed')
  );
  
  sendAdminNewOrderNotification(order).catch((err) =>
    logger.error({ err, orderId: order._id }, 'orderService.createCodOrder:adminNotificationFailed')
  );

  logger.info({ orderId: order._id.toString() }, 'orderService.createCodOrder:success');
  return order;
}

export async function getOrderById(orderId: string, userId: string) {
  logger.info({ orderId }, 'orderService.getOrderById:start');
  
  // Validate ObjectId format
  if (!Types.ObjectId.isValid(orderId)) {
    throw errors.badRequest('Invalid order ID');
  }

  const order = await Order.findById(orderId).populate('items.productId', 'slug name price');
  
  if (!order) throw errors.notFound('Order not found');
  
  // Ensure user can only access their own orders
  if (order.userId.toString() !== userId) {
    throw errors.forbidden('You can only view your own orders');
  }

  logger.info({ orderId }, 'orderService.getOrderById:success');
  
  // Transform the response to match frontend expectations
  return {
    _id: order._id.toString(),
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


