import type { Request, Response } from 'express';
import { withRequestContext } from '../lib/logger';
import { errors } from '../lib/errors';
import { createCategorySchema, updateCategorySchema, createProductSchema, updateProductSchema, listProductsQuerySchema } from '../validators/catalog';
import { listCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { listProducts, getProductBySlug, createProduct, updateProduct, deleteProduct } from '../services/productService';

// Categories
export async function listCategoriesCtrl(_req: Request, res: Response) {
  const items = await listCategories();
  return res.json({ items });
}

export async function getCategoryCtrl(req: Request, res: Response) {
  const slug = req.params.slug;
  const cat = await getCategoryBySlug(slug);
  return res.json({ category: cat });
}

export async function createCategoryCtrl(req: Request, res: Response) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  const cat = await createCategory(parsed.data);
  return res.status(201).json({ category: cat });
}

export async function updateCategoryCtrl(req: Request, res: Response) {
  const slug = req.params.slug;
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  const cat = await updateCategory(slug, parsed.data);
  return res.json({ category: cat });
}

export async function deleteCategoryCtrl(req: Request, res: Response) {
  const slug = req.params.slug;
  const ok = await deleteCategory(slug);
  return res.json(ok);
}

// Products
export async function listProductsCtrl(req: Request, res: Response) {
  const parsed = listProductsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw errors.unprocessable('Invalid query', parsed.error.flatten());
  const result = await listProducts(parsed.data);
  return res.json(result);
}

export async function getProductCtrl(req: Request, res: Response) {
  const slug = req.params.slug;
  const p = await getProductBySlug(slug);
  return res.json({ product: p });
}

export async function createProductCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  const p = await createProduct(parsed.data);
  log.info({ slug: p.slug }, 'createProduct:success');
  return res.status(201).json({ product: p });
}

export async function updateProductCtrl(req: Request, res: Response) {
  const slug = req.params.slug;
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  const p = await updateProduct(slug, parsed.data);
  return res.json({ product: p });
}

export async function deleteProductCtrl(req: Request, res: Response) {
  const slug = req.params.slug;
  const ok = await deleteProduct(slug);
  return res.json(ok);
}


