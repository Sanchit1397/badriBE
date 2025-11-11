import type { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { errors } from '../lib/errors';
import { Media } from '../models/Media';

export async function uploadImage(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) throw errors.badRequest('No file uploaded');
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) throw errors.badRequest('Unsupported file type');
  if (file.size > 5 * 1024 * 1024) throw errors.badRequest('File too large');
  const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
  await Media.updateOne(
    { hash },
    { $setOnInsert: { filename: file.originalname, mimeType: file.mimetype, size: file.size } },
    { upsert: true }
  );
  const uploadRoot = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadRoot, { recursive: true });
  const abs = path.join(uploadRoot, hash);
  try {
    await fs.access(abs);
  } catch {
    await fs.writeFile(abs, file.buffer);
  }
  return res.status(201).json({ hash });
}


