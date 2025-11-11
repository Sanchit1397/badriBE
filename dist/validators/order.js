"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = exports.orderItemSchema = void 0;
const zod_1 = require("zod");
exports.orderItemSchema = zod_1.z.object({
    slug: zod_1.z.string().min(2, 'Product slug is required'),
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1')
});
exports.createOrderSchema = zod_1.z.object({
    items: zod_1.z.array(exports.orderItemSchema).min(1, 'Order must have at least one item'),
    deliveryFee: zod_1.z.number().nonnegative('Delivery fee cannot be negative'),
    address: zod_1.z.string().min(5, 'Address is required'),
    phone: zod_1.z.string().min(10, 'Phone number is required')
});
