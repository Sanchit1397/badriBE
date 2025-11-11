import type { Request, Response } from 'express';
import { registerSchema, loginSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth';
import { loginUser, registerUser, verifyEmailToken, resendVerificationEmail, startPasswordReset, completePasswordReset } from '../services/authService';
import { errors } from '../lib/errors';
import { withRequestContext } from '../lib/logger';

export async function register(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info({ path: '/auth/register' }, 'register:start');
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  const { verificationLink } = await registerUser(parsed.data);
  log.info({ verificationLink }, 'register:verification_link');
  const response: Record<string, unknown> = {
    ok: true,
    message: 'Registration successful. Please verify your email before logging in.'
  };
  if (process.env.NODE_ENV !== 'production') response.verificationLink = verificationLink;
  log.info('register:success');
  return res.status(201).json(response);
}

export async function login(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info({ path: '/auth/login' }, 'login:start');
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  const { token, user } = await loginUser(parsed.data);
  log.info({ uid: user._id.toString(), role: user.role }, 'login:success');
  return res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
}

export async function verify(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info({ path: '/auth/verify' }, 'verify:start');
  const token = (req.query.token as string) || '';
  if (!token) throw errors.badRequest('Missing token');
  await verifyEmailToken(token);
  log.info('verify:success');
  return res.json({ ok: true });
}

export async function resendVerification(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info({ path: '/auth/resend' }, 'resend:start');
  const parsed = resendVerificationSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  await resendVerificationEmail(parsed.data.email);
  log.info('resend:success');
  return res.json({ ok: true });
}

export async function forgotPassword(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info({ path: '/auth/forgot' }, 'forgot:start');
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  await startPasswordReset(parsed.data.email);
  log.info('forgot:sent');
  return res.json({ ok: true });
}

export async function resetPassword(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info({ path: '/auth/reset' }, 'reset:start');
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  await completePasswordReset(parsed.data.token, parsed.data.password);
  log.info('reset:success');
  return res.json({ ok: true });
}


