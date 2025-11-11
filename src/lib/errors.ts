import type { NextFunction, Request, Response } from 'express';
import { withRequestContext } from './logger';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    try {
      const log = withRequestContext(_req.headers as any);
      log.warn({ code: err.code, status: err.status, details: err.details }, 'AppError');
    } catch {}
    return res.status(err.status).json({ code: err.code, error: err.message, details: err.details });
  }
  // Handle common DB errors
  if (typeof err === 'object' && err && (err as any).code === 11000) {
    return res.status(409).json({ code: 'CONFLICT', error: 'Duplicate key', details: (err as any).keyValue });
  }
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Something went wrong' });
}

export const errors = {
  badRequest: (message = 'Invalid request', details?: unknown) => new AppError(400, 'BAD_REQUEST', message, details),
  unauthorized: (message = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message),
  notFound: (message = 'Not found') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message = 'Conflict') => new AppError(409, 'CONFLICT', message),
  unprocessable: (message = 'Unprocessable entity', details?: unknown) => new AppError(422, 'UNPROCESSABLE_ENTITY', message, details)
};


