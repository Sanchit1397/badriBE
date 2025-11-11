import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/authz';
import { uploadImage } from '../controllers/uploadController';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/image', requireAdmin, upload.single('file'), (req, res, next) => {
  Promise.resolve(uploadImage(req, res)).catch(next);
});

export default router;


