"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.verifyEmailToken = verifyEmailToken;
exports.resendVerificationEmail = resendVerificationEmail;
exports.startPasswordReset = startPasswordReset;
exports.completePasswordReset = completePasswordReset;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const mail_1 = require("../lib/mail");
const verifyEmail_1 = require("../mail/templates/verifyEmail");
const resetPassword_1 = require("../mail/templates/resetPassword");
async function registerUser(params) {
    logger_1.logger.info({ email: params.email }, 'authService.registerUser:start');
    const { name, email, password, phone, address } = params;
    try {
        const existing = await User_1.User.findOne({ email });
        if (existing)
            throw errors_1.errors.conflict('Email already in use');
        const passwordHash = await (0, auth_1.hashPassword)(password);
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const user = await User_1.User.create({ name, email, passwordHash, phone, address, role: 'user', isVerified: false, verificationToken, verificationTokenExpiresAt });
        const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
        const verificationLink = `${frontend}/auth/verify?token=${verificationToken}`;
        const tpl = (0, verifyEmail_1.buildVerifyEmailTemplate)({ name, link: verificationLink });
        await (0, mail_1.sendMail)({ to: email, subject: tpl.subject, html: tpl.html });
        logger_1.logger.info({ uid: user._id.toString() }, 'authService.registerUser:success');
        return { verificationLink, user };
    }
    catch (err) {
        if (typeof err === 'object' && err && err.code === 11000) {
            throw errors_1.errors.conflict('Email already in use');
        }
        logger_1.logger.error({ err }, 'authService.registerUser:error');
        throw err;
    }
}
async function loginUser(params) {
    logger_1.logger.info({ email: params.email }, 'authService.loginUser:start');
    const { email, password } = params;
    try {
        const user = await User_1.User.findOne({ email });
        if (!user)
            throw errors_1.errors.unauthorized('Invalid email or password');
        if (!user.isVerified)
            throw errors_1.errors.forbidden('Email not verified');
        const ok = await (0, auth_1.verifyPassword)(password, user.passwordHash);
        if (!ok)
            throw errors_1.errors.unauthorized('Invalid email or password');
        const token = await (0, auth_1.signJwt)({ uid: user._id.toString(), role: user.role, email: user.email, name: user.name });
        logger_1.logger.info({ uid: user._id.toString(), role: user.role }, 'authService.loginUser:success');
        return { token, user };
    }
    catch (err) {
        logger_1.logger.error({ err }, 'authService.loginUser:error');
        throw err;
    }
}
async function verifyEmailToken(token) {
    logger_1.logger.info('authService.verifyEmailToken:start');
    const user = await User_1.User.findOne({ verificationToken: token });
    if (!user)
        throw errors_1.errors.badRequest('Invalid token');
    if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt.getTime() < Date.now()) {
        throw errors_1.errors.badRequest('Token expired');
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    await user.save();
    logger_1.logger.info({ uid: user._id.toString() }, 'authService.verifyEmailToken:success');
    return { ok: true };
}
async function resendVerificationEmail(email) {
    logger_1.logger.info({ email }, 'authService.resendVerification:start');
    const user = await User_1.User.findOne({ email });
    if (!user)
        throw errors_1.errors.notFound('Account not found');
    if (user.isVerified)
        throw errors_1.errors.conflict('Email already verified');
    const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = verificationTokenExpiresAt;
    await user.save();
    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    const verificationLink = `${frontend}/auth/verify?token=${verificationToken}`;
    const tpl = (0, verifyEmail_1.buildVerifyEmailTemplate)({ name: user.name, link: verificationLink });
    await (0, mail_1.sendMail)({ to: email, subject: tpl.subject, html: tpl.html });
    logger_1.logger.info({ uid: user._id.toString() }, 'authService.resendVerification:sent');
    return { ok: true };
}
async function startPasswordReset(email) {
    logger_1.logger.info({ email }, 'authService.startPasswordReset:start');
    const user = await User_1.User.findOne({ email });
    if (!user)
        return { ok: true }; // do not leak existence
    if (!user.isVerified)
        return { ok: true }; // enforce verification first
    const resetPasswordToken = crypto_1.default.randomBytes(32).toString('hex');
    const resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpiresAt = resetPasswordExpiresAt;
    await user.save();
    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    const link = `${frontend}/auth/reset?token=${resetPasswordToken}`;
    const tpl = (0, resetPassword_1.buildResetPasswordTemplate)({ name: user.name, link });
    await (0, mail_1.sendMail)({ to: email, subject: tpl.subject, html: tpl.html });
    logger_1.logger.info({ uid: user._id.toString() }, 'authService.startPasswordReset:sent');
    return { ok: true };
}
async function completePasswordReset(token, password) {
    logger_1.logger.info('authService.completePasswordReset:start');
    const user = await User_1.User.findOne({ resetPasswordToken: token });
    if (!user)
        throw errors_1.errors.badRequest('Invalid token');
    if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt.getTime() < Date.now()) {
        throw errors_1.errors.badRequest('Token expired');
    }
    user.passwordHash = await (0, auth_1.hashPassword)(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save();
    logger_1.logger.info({ uid: user._id.toString() }, 'authService.completePasswordReset:success');
    return { ok: true };
}
