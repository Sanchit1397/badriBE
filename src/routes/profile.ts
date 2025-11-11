import { Router, type Request, type Response, type NextFunction } from 'express';
import { getUserProfileCtrl, updateUserProfileCtrl, changePasswordCtrl, getUserOrdersCtrl } from '../controllers/profileController';
import { requireAuth } from '../middleware/authz';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };

const router = Router();

// All profile routes require authentication
router.get('/', requireAuth, asyncHandler(getUserProfileCtrl));
router.put('/', requireAuth, asyncHandler(updateUserProfileCtrl));
router.post('/change-password', requireAuth, asyncHandler(changePasswordCtrl));
router.get('/orders', requireAuth, asyncHandler(getUserOrdersCtrl));

export default router;

