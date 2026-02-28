import type { Request, Response } from 'express';
import { errors } from '../lib/errors';
import { withRequestContext } from '../lib/logger';
import { uploadImage as uploadImageService } from '../services/uploadService';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadImage(req: Request, res: Response) {
  const log = withRequestContext(req.headers as Record<string, string | undefined>);
  log.info('uploadImage:start');

  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw errors.badRequest('No file uploaded');
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) throw errors.badRequest('Unsupported file type');
  if (file.size > MAX_SIZE) throw errors.badRequest('File too large');

  const { hash } = await uploadImageService({
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
    size: file.size
  });

  log.info({ hash }, 'uploadImage:success');
  return res.status(201).json({ hash });
}


