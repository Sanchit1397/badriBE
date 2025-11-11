"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfileCtrl = getUserProfileCtrl;
exports.updateUserProfileCtrl = updateUserProfileCtrl;
exports.changePasswordCtrl = changePasswordCtrl;
exports.getUserOrdersCtrl = getUserOrdersCtrl;
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const profile_1 = require("../validators/profile");
const profileService_1 = require("../services/profileService");
async function getUserProfileCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('profile.get:start');
    const userId = req.user?.uid;
    if (!userId)
        throw errors_1.errors.unauthorized();
    const profile = await (0, profileService_1.getUserProfile)(userId);
    log.info({ userId }, 'profile.get:success');
    return res.json({ profile });
}
async function updateUserProfileCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('profile.update:start');
    const userId = req.user?.uid;
    if (!userId)
        throw errors_1.errors.unauthorized();
    const parsed = profile_1.updateProfileSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const profile = await (0, profileService_1.updateUserProfile)(userId, parsed.data);
    log.info({ userId }, 'profile.update:success');
    return res.json({ profile });
}
async function changePasswordCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('profile.changePassword:start');
    const userId = req.user?.uid;
    if (!userId)
        throw errors_1.errors.unauthorized();
    const parsed = profile_1.changePasswordSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const result = await (0, profileService_1.changeUserPassword)(userId, parsed.data.currentPassword, parsed.data.newPassword);
    log.info({ userId }, 'profile.changePassword:success');
    return res.json(result);
}
async function getUserOrdersCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('profile.orders:start');
    const userId = req.user?.uid;
    if (!userId)
        throw errors_1.errors.unauthorized();
    const orders = await (0, profileService_1.getUserOrders)(userId);
    log.info({ userId, count: orders.length }, 'profile.orders:success');
    return res.json({ orders });
}
