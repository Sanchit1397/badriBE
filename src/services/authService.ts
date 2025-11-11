import crypto from 'crypto';
import { User } from '../models/User';
import { hashPassword, signJwt, verifyPassword } from '../lib/auth';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';
import { sendMail } from '../lib/mail';
import { buildVerifyEmailTemplate } from '../mail/templates/verifyEmail';
import { buildResetPasswordTemplate } from '../mail/templates/resetPassword';

export async function registerUser(params: { name: string; email: string; password: string; phone?: string; address?: string }) {
  logger.info({ email: params.email }, 'authService.registerUser:start');
  const { name, email, password, phone, address } = params;
  try {
    const existing = await User.findOne({ email });
    if (existing) throw errors.conflict('Email already in use');
    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const user = await User.create({ name, email, passwordHash, phone, address, role: 'user', isVerified: false, verificationToken, verificationTokenExpiresAt });
    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    const verificationLink = `${frontend}/auth/verify?token=${verificationToken}`;
    const tpl = buildVerifyEmailTemplate({ name, link: verificationLink });
    await sendMail({ to: email, subject: tpl.subject, html: tpl.html });
    logger.info({ uid: user._id.toString() }, 'authService.registerUser:success');
    return { verificationLink, user };
  } catch (err) {
    if (typeof err === 'object' && err && (err as any).code === 11000) {
      throw errors.conflict('Email already in use');
    }
    logger.error({ err }, 'authService.registerUser:error');
    throw err;
  }
}

export async function loginUser(params: { email: string; password: string }) {
  logger.info({ email: params.email }, 'authService.loginUser:start');
  const { email, password } = params;
  try {
    const user = await User.findOne({ email });
    if (!user) throw errors.unauthorized('Invalid email or password');
    if (!user.isVerified) throw errors.forbidden('Email not verified');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw errors.unauthorized('Invalid email or password');
    const token = await signJwt({ uid: user._id.toString(), role: user.role, email: user.email, name: user.name });
    logger.info({ uid: user._id.toString(), role: user.role }, 'authService.loginUser:success');
    return { token, user };
  } catch (err) {
    logger.error({ err }, 'authService.loginUser:error');
    throw err;
  }
}

export async function verifyEmailToken(token: string) {
  logger.info('authService.verifyEmailToken:start');
  const user = await User.findOne({ verificationToken: token });
  if (!user) throw errors.badRequest('Invalid token');
  if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt.getTime() < Date.now()) {
    throw errors.badRequest('Token expired');
  }
  user.isVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpiresAt = null;
  await user.save();
  logger.info({ uid: user._id.toString() }, 'authService.verifyEmailToken:success');
  return { ok: true } as const;
}

export async function resendVerificationEmail(email: string) {
  logger.info({ email }, 'authService.resendVerification:start');
  const user = await User.findOne({ email });
  if (!user) throw errors.notFound('Account not found');
  if (user.isVerified) throw errors.conflict('Email already verified');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.verificationToken = verificationToken;
  user.verificationTokenExpiresAt = verificationTokenExpiresAt;
  await user.save();
  const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const verificationLink = `${frontend}/auth/verify?token=${verificationToken}`;
  const tpl = buildVerifyEmailTemplate({ name: user.name, link: verificationLink });
  await sendMail({ to: email, subject: tpl.subject, html: tpl.html });
  logger.info({ uid: user._id.toString() }, 'authService.resendVerification:sent');
  return { ok: true } as const;
}

export async function startPasswordReset(email: string) {
  logger.info({ email }, 'authService.startPasswordReset:start');
  const user = await User.findOne({ email });
  if (!user) return { ok: true } as const; // do not leak existence
  if (!user.isVerified) return { ok: true } as const; // enforce verification first
  const resetPasswordToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpiresAt = resetPasswordExpiresAt;
  await user.save();
  const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const link = `${frontend}/auth/reset?token=${resetPasswordToken}`;
  const tpl = buildResetPasswordTemplate({ name: user.name, link });
  await sendMail({ to: email, subject: tpl.subject, html: tpl.html });
  logger.info({ uid: user._id.toString() }, 'authService.startPasswordReset:sent');
  return { ok: true } as const;
}

export async function completePasswordReset(token: string, password: string) {
  logger.info('authService.completePasswordReset:start');
  const user = await User.findOne({ resetPasswordToken: token });
  if (!user) throw errors.badRequest('Invalid token');
  if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt.getTime() < Date.now()) {
    throw errors.badRequest('Token expired');
  }
  user.passwordHash = await hashPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpiresAt = null;
  await user.save();
  logger.info({ uid: user._id.toString() }, 'authService.completePasswordReset:success');
  return { ok: true } as const;
}


