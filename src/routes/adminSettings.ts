import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  getAllSettingsCtrl,
  getSettingCtrl,
  getSettingsByCategoryCtrl,
  updateSettingCtrl,
  createSettingCtrl,
  deleteSettingCtrl,
  getCacheStatsCtrl
} from '../controllers/settingsController';
import { requireAdmin } from '../middleware/authz';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();

// All routes require admin authentication
router.use(requireAdmin);

// Cache stats (monitoring)
router.get('/cache/stats', asyncHandler(getCacheStatsCtrl));

// Category-based retrieval
router.get('/category/:category', asyncHandler(getSettingsByCategoryCtrl));

// CRUD operations
router.get('/', asyncHandler(getAllSettingsCtrl));
router.get('/:key', asyncHandler(getSettingCtrl));
router.put('/:key', asyncHandler(updateSettingCtrl));
router.post('/', asyncHandler(createSettingCtrl));
router.delete('/:key', asyncHandler(deleteSettingCtrl));

export default router;

