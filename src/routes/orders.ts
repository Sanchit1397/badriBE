import { Router, type Request, type Response, type NextFunction } from 'express';
import { createOrderCtrl, getOrderByIdCtrl } from '../controllers/orderController';
import { requireAuth } from '../middleware/authz';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };

const router = Router();

router.post('/', requireAuth, asyncHandler(createOrderCtrl)); // requires auth
router.get('/:id', requireAuth, asyncHandler(getOrderByIdCtrl)); // requires auth

export default router;


