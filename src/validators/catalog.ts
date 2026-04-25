import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_ERROR = 'Slug must use lowercase letters and hyphens only (e.g. product-name)';

const slugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .regex(SLUG_REGEX, SLUG_ERROR);

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: slugSchema
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  slug: slugSchema.optional()
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: slugSchema,
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  imageUrl: z.string().url().optional(),
  categorySlug: z.string().min(2, 'Please select a category'),
  published: z.boolean().optional(),
  images: z
    .array(
      z.object({
        hash: z.string().min(10),
        alt: z.string().optional(),
        primary: z.boolean().optional()
      })
    )
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional()
    })
    .optional(),
  inventory: z
    .object({
      track: z.boolean(),
      stock: z.number().int().min(0)
    })
    .optional(),
  discount: z
    .object({
      type: z.enum(['percentage', 'fixed']),
      value: z.number().min(0),
      active: z.boolean()
    })
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        if (data.type === 'percentage' && data.value > 100) return false;
        return true;
      },
      { message: 'Percentage discount cannot exceed 100%' }
    )
});

export const updateProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0').optional(),
  imageUrl: z.string().url().optional(),
  categorySlug: z.string().min(2, 'Please select a category').optional(),
  published: z.boolean().optional(),
  images: z
    .array(
      z.object({
        hash: z.string().min(10),
        alt: z.string().optional(),
        primary: z.boolean().optional()
      })
    )
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional()
    })
    .optional(),
  inventory: z
    .object({
      track: z.boolean(),
      stock: z.number().int().min(0)
    })
    .optional(),
  discount: z
    .object({
      type: z.enum(['percentage', 'fixed']),
      value: z.number().min(0),
      active: z.boolean()
    })
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        if (data.type === 'percentage' && data.value > 100) return false;
        return true;
      },
      { message: 'Percentage discount cannot exceed 100%' }
    )
});

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['new', 'price_asc', 'price_desc']).optional(),
  published: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12)
});


