import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';

export async function listCategories() {
  logger.info('categoryService.listCategories');
  const items = await Category.find({}).sort({ name: 1 });
  return items;
}

export async function getCategoryBySlug(slug: string) {
  const cat = await Category.findOne({ slug });
  if (!cat) throw errors.notFound('Category not found');
  return cat;
}

export async function createCategory(input: { name: string; slug: string }) {
  logger.info({ slug: input.slug }, 'categoryService.createCategory');
  const exists = await Category.findOne({ $or: [{ slug: input.slug }, { name: input.name }] });
  if (exists) throw errors.conflict('Category already exists');
  const cat = await Category.create(input);
  return cat;
}

export async function updateCategory(slug: string, updates: Partial<{ name: string; slug: string }>) {
  const cat = await Category.findOne({ slug });
  if (!cat) throw errors.notFound('Category not found');
  if (updates.slug) {
    const exists = await Category.findOne({ slug: updates.slug });
    if (exists && exists._id.toString() !== cat._id.toString()) throw errors.conflict('Slug already in use');
  }
  Object.assign(cat, updates);
  await cat.save();
  return cat;
}

export async function deleteCategory(slug: string) {
  const cat = await Category.findOne({ slug });
  if (!cat) throw errors.notFound('Category not found');
  const productCount = await Product.countDocuments({ categoryId: cat._id });
  if (productCount > 0) throw errors.conflict('Category has products and cannot be deleted');
  await cat.deleteOne();
  return { ok: true } as const;
}


