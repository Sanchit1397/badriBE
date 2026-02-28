import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { errors } from '../lib/errors';
import { withRequestContext } from '../lib/logger';
import { signPath, verifySignature } from '../lib/signing';
import { isCloudinaryConfigured, getCloudinaryUrl } from '../lib/cloudinary';

export async function getSignedUrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as Record<string, string | undefined>);
  const hash = req.params.hash;
  if (!hash) throw errors.badRequest('Missing hash');

  if (isCloudinaryConfigured()) {
    const url = getCloudinaryUrl(hash);
    log.debug({ hash }, 'getSignedUrl:cloudinary');
    return res.json({ url, exp: Date.now() + 365 * 24 * 60 * 60 * 1000 });
  }

  const ttlMs = Number(process.env.MEDIA_URL_TTL_MS || 24 * 60 * 60 * 1000);
  const filePath = `/media/${hash}`;
  const exp = Date.now() + ttlMs;
  const { sig } = signPath(filePath, exp);
  const url = new URL(`/media/${hash}`, `${req.protocol}://${req.get('host')}`);
  url.searchParams.set('exp', String(exp));
  url.searchParams.set('sig', sig);
  return res.json({ url: url.toString(), exp });
}

export async function serveMedia(req: Request, res: Response) {
  const hash = req.params.hash;
  const exp = Number(req.query.exp || 0);
  const sig = String(req.query.sig || '');
  const filePath = `/media/${hash}`;
  if (!verifySignature(filePath, exp, sig)) throw errors.forbidden('Invalid or expired signature');
  const root = path.resolve(process.cwd(), 'uploads');
  const abs = path.join(root, hash);
  try {
    await fs.access(abs);
  } catch {
    throw errors.notFound('Media not found');
  }
  return res.sendFile(abs);
}


