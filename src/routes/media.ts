import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { getSignedUrl, serveMedia } from '../controllers/mediaController';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();

router.get('/sign/:hash', asyncHandler(getSignedUrl));
router.get('/:hash', asyncHandler(serveMedia));

export default router;


