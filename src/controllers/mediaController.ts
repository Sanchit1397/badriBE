import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { errors } from '../lib/errors';
import { signPath, verifySignature } from '../lib/signing';

export async function getSignedUrl(req: Request, res: Response) {
  const hash = req.params.hash;
  if (!hash) throw errors.badRequest('Missing hash');
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
  if (!verifySignature(filePath, exp, sig)) return res.status(403).send('Forbidden');
  const root = path.resolve(process.cwd(), 'uploads');
  const abs = path.join(root, hash);
  try {
    await fs.access(abs);
  } catch {
    return res.status(404).send('Not found');
  }
  return res.sendFile(abs);
}


