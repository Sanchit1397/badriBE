import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAdmin } from '../middleware/authz';
import {
  listCategoriesCtrl,
  getCategoryCtrl,
  createCategoryCtrl,
  updateCategoryCtrl,
  deleteCategoryCtrl,
  listProductsCtrl,
  getProductCtrl,
  createProductCtrl,
  updateProductCtrl,
  deleteProductCtrl
} from '../controllers/catalogController';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();

// Public endpoints
router.get('/categories', asyncHandler(listCategoriesCtrl));
router.get('/categories/:slug', asyncHandler(getCategoryCtrl));
router.get('/products', asyncHandler(listProductsCtrl));
router.get('/products/:slug', asyncHandler(getProductCtrl));

// Admin endpoints
router.post('/categories', requireAdmin, asyncHandler(createCategoryCtrl));
router.put('/categories/:slug', requireAdmin, asyncHandler(updateCategoryCtrl));
router.delete('/categories/:slug', requireAdmin, asyncHandler(deleteCategoryCtrl));
router.post('/products', requireAdmin, asyncHandler(createProductCtrl));
router.put('/products/:slug', requireAdmin, asyncHandler(updateProductCtrl));
router.delete('/products/:slug', requireAdmin, asyncHandler(deleteProductCtrl));

export default router;


