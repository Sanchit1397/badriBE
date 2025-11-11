import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAllOrdersCtrl, getOrderByIdAdminCtrl, updateOrderStatusCtrl } from '../controllers/adminOrderController';
import { requireAdmin } from '../middleware/authz';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };

const router = Router();

// All routes require admin
router.get('/', requireAdmin, asyncHandler(getAllOrdersCtrl));
router.get('/:id', requireAdmin, asyncHandler(getOrderByIdAdminCtrl));
router.patch('/:id/status', requireAdmin, asyncHandler(updateOrderStatusCtrl));

export default router;

