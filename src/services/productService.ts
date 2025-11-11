// @ts-nocheck
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';

export interface ListProductsParams {
  q?: string;
  category?: string; // slug
  sort?: 'new' | 'price_asc' | 'price_desc';
  published?: boolean;
  page: number;
  limit: number;
}

export async function listProducts(params: ListProductsParams) {
  logger.info({ params }, 'productService.listProducts');
  const { q, category, sort = 'new', page = 1, limit = 12, published } = params;
  const filter: Record<string, unknown> = {};
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.categoryId = cat._id;
  }
  if (typeof published === 'boolean') filter.published = published;
  const sortSpec = sort === 'price_asc' ? { price: 1 } : sort === 'price_desc' ? { price: -1 } : { createdAt: -1 };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortSpec).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);
  return { items, total, page, limit };
}

export async function getProductBySlug(slug: string) {
  const p = await Product.findOne({ slug });
  if (!p) throw errors.notFound('Product not found');
  return p;
}

export async function createProduct(input: { name: string; slug: string; description?: string; price: number; imageUrl?: string; categorySlug: string }) {
  logger.info({ slug: input.slug }, 'productService.createProduct');
  const exists = await Product.findOne({ $or: [{ slug: input.slug }, { name: input.name }] });
  if (exists) throw errors.conflict('Product already exists');
  const cat = await Category.findOne({ slug: input.categorySlug });
  if (!cat) throw errors.badRequest('Invalid category');
  const p = await Product.create({
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl,
    categoryId: cat._id
  });
  return p;
}

export async function updateProduct(slug: string, updates: Partial<{ name: string; slug: string; description?: string; price: number; imageUrl?: string; categorySlug: string }>) {
  const p = await Product.findOne({ slug });
  if (!p) throw errors.notFound('Product not found');
  if (updates.slug) {
    const s = await Product.findOne({ slug: updates.slug });
    if (s && s._id.toString() !== p._id.toString()) throw errors.conflict('Slug already in use');
  }
  if (updates.categorySlug) {
    const cat = await Category.findOne({ slug: updates.categorySlug });
    if (!cat) throw errors.badRequest('Invalid category');
    (updates as any).categoryId = cat._id;
    delete (updates as any).categorySlug;
  }
  Object.assign(p, updates);
  await p.save();
  return p;
}

export async function deleteProduct(slug: string) {
  const p = await Product.findOne({ slug });
  if (!p) throw errors.notFound('Product not found');
  await p.deleteOne();
  return { ok: true } as const;
}


