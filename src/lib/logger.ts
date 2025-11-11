import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined
});

export function withRequestContext(headers?: Record<string, string | undefined>) {
  const requestId = headers?.['x-request-id'] || headers?.['x-correlation-id'];
  return logger.child({ requestId });
}


