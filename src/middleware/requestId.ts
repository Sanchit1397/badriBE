import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existing = (req.headers['x-request-id'] as string | undefined) || (req.headers['x-correlation-id'] as string | undefined);
  const requestId = existing || uuidv4();
  // Attach to request headers so log helper can pick it up
  (req.headers as Record<string, string>)['x-request-id'] = requestId;
  // Echo back in response header for clients to capture
  res.setHeader('X-Request-Id', requestId);
  next();
}


