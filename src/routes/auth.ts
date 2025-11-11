import { Router, type Request, type Response, type NextFunction } from 'express';
import { register, login, verify, resendVerification, forgotPassword, resetPassword } from '../controllers/authController';
import { rateLimit } from '../middleware/rateLimit';
import { AppError } from '../lib/errors';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/verify', asyncHandler(verify));
router.post('/resend', rateLimit({ windowMs: 60_000, max: 3 }), asyncHandler(resendVerification));
router.post('/forgot', rateLimit({ windowMs: 60_000, max: 3 }), asyncHandler(forgotPassword));
router.post('/reset', asyncHandler(resetPassword));

export default router;


