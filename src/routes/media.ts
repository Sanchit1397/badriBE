import { Router } from 'express';
import { getSignedUrl, serveMedia } from '../controllers/mediaController';

const router = Router();

router.get('/sign/:hash', (req, res, next) => { Promise.resolve(getSignedUrl(req, res)).catch(next); });
router.get('/:hash', (req, res, next) => { Promise.resolve(serveMedia(req, res)).catch(next); });

export default router;


