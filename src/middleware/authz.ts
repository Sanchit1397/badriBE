import type { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../lib/auth';
import { withRequestContext } from '../lib/logger';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const log = withRequestContext(req.headers as any);
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const payload = await verifyJwt(token);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  // @ts-expect-error attach user
  req.user = payload;
  log.debug({ uid: payload.uid, role: payload.role }, 'requireAuth:ok');
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const payload = await verifyJwt(token);
  if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  // @ts-expect-error attach user
  req.user = payload;
  next();
}


