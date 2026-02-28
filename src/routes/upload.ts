import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';

import { uploadImage } from '../controllers/uploadController';
import { requireAdmin } from '../middleware/authz';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/image', requireAdmin, upload.single('file'), asyncHandler(uploadImage));

export default router;


