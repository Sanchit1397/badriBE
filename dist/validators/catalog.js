"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProductsQuerySchema = exports.updateProductSchema = exports.createProductSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2)
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    slug: zod_1.z.string().min(2).optional()
});
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive('Price must be greater than 0'),
    imageUrl: zod_1.z.string().url().optional(),
    categorySlug: zod_1.z.string().min(2)
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    slug: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive('Price must be greater than 0').optional(),
    imageUrl: zod_1.z.string().url().optional(),
    categorySlug: zod_1.z.string().min(2).optional(),
    published: zod_1.z.boolean().optional(),
    images: zod_1.z
        .array(zod_1.z.object({
        hash: zod_1.z.string().min(10),
        alt: zod_1.z.string().optional(),
        primary: zod_1.z.boolean().optional()
    }))
        .optional(),
    seo: zod_1.z
        .object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional()
    })
        .optional(),
    inventory: zod_1.z
        .object({
        track: zod_1.z.boolean(),
        stock: zod_1.z.number().int().min(0)
    })
        .optional(),
    discount: zod_1.z
        .object({
        type: zod_1.z.enum(['percentage', 'fixed']),
        value: zod_1.z.number().min(0),
        active: zod_1.z.boolean()
    })
        .optional()
        .refine((data) => {
        if (!data)
            return true;
        if (data.type === 'percentage' && data.value > 100)
            return false;
        return true;
    }, { message: 'Percentage discount cannot exceed 100%' })
});
exports.listProductsQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    sort: zod_1.z.enum(['new', 'price_asc', 'price_desc']).optional(),
    published: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal('false')])
        .transform((v) => v === 'true')
        .optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(12)
});
