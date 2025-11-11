import { z } from 'zod';

export const orderItemSchema = z.object({
  slug: z.string().min(2, 'Product slug is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  deliveryFee: z.number().nonnegative('Delivery fee cannot be negative'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Phone number is required')
});


