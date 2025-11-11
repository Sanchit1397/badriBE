"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.verify = verify;
exports.resendVerification = resendVerification;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const auth_1 = require("../validators/auth");
const authService_1 = require("../services/authService");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
async function register(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info({ path: '/auth/register' }, 'register:start');
    const parsed = auth_1.registerSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const { verificationLink } = await (0, authService_1.registerUser)(parsed.data);
    log.info({ verificationLink }, 'register:verification_link');
    const response = {
        ok: true,
        message: 'Registration successful. Please verify your email before logging in.'
    };
    if (process.env.NODE_ENV !== 'production')
        response.verificationLink = verificationLink;
    log.info('register:success');
    return res.status(201).json(response);
}
async function login(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info({ path: '/auth/login' }, 'login:start');
    const parsed = auth_1.loginSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const { token, user } = await (0, authService_1.loginUser)(parsed.data);
    log.info({ uid: user._id.toString(), role: user.role }, 'login:success');
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
}
async function verify(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info({ path: '/auth/verify' }, 'verify:start');
    const token = req.query.token || '';
    if (!token)
        throw errors_1.errors.badRequest('Missing token');
    await (0, authService_1.verifyEmailToken)(token);
    log.info('verify:success');
    return res.json({ ok: true });
}
async function resendVerification(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info({ path: '/auth/resend' }, 'resend:start');
    const parsed = auth_1.resendVerificationSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    await (0, authService_1.resendVerificationEmail)(parsed.data.email);
    log.info('resend:success');
    return res.json({ ok: true });
}
async function forgotPassword(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info({ path: '/auth/forgot' }, 'forgot:start');
    const parsed = auth_1.forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    await (0, authService_1.startPasswordReset)(parsed.data.email);
    log.info('forgot:sent');
    return res.json({ ok: true });
}
async function resetPassword(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info({ path: '/auth/reset' }, 'reset:start');
    const parsed = auth_1.resetPasswordSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    await (0, authService_1.completePasswordReset)(parsed.data.token, parsed.data.password);
    log.info('reset:success');
    return res.json({ ok: true });
}
