"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const User_1 = require("../models/User");
const auth_1 = require("../lib/auth");
const logger_1 = require("../lib/logger");
const router = (0, express_1.Router)();
function requireAdmin(req, res, next) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('requireAdmin:start');
    const header = req.header('Authorization');
    if (!header)
        return res.status(401).json({ error: 'Unauthorized' });
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    void (0, auth_1.verifyJwt)(token).then((payload) => {
        if (!payload || payload.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        // @ts-expect-error attach user
        req.user = payload;
        log.info('requireAdmin:ok');
        next();
    });
}
router.post('/bootstrap', async (req, res) => {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('admin.bootstrap:start');
    const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
    const token = req.header('x-admin-bootstrap-token') || '';
    if (!expectedToken)
        return res.status(503).json({ error: 'Bootstrap disabled' });
    if (token !== expectedToken)
        return res.status(403).json({ error: 'Forbidden' });
    const email = process.env.ADMIN_DEFAULT_EMAIL || '';
    const password = process.env.ADMIN_DEFAULT_PASSWORD || '';
    const name = process.env.ADMIN_DEFAULT_NAME || 'Administrator';
    if (!email || !password)
        return res.status(400).json({ error: 'Missing admin defaults' });
    const existingAdmin = await User_1.User.findOne({ role: 'admin' });
    if (existingAdmin)
        return res.status(409).json({ error: 'Admin already exists' });
    const passwordHash = await (0, auth_1.hashPassword)(password);
    const user = await User_1.User.create({ name, email, passwordHash, role: 'admin' });
    log.info({ uid: user._id.toString() }, 'admin.bootstrap:success');
    return res.status(201).json({ ok: true, admin: { id: user._id, email: user.email, name: user.name, role: user.role } });
});
const adminUpdateSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    currentPassword: zod_1.z.string().min(6).optional(),
    newPassword: zod_1.z.string().min(6).optional()
})
    .refine((d) => (d.newPassword ? !!d.currentPassword : true), {
    message: 'currentPassword is required to set a newPassword',
    path: ['currentPassword']
})
    .refine((d) => d.email !== undefined || d.newPassword !== undefined, {
    message: 'Provide at least one of email or newPassword',
    path: ['email']
});
router.post('/settings', requireAdmin, async (req, res) => {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('admin.settings:start');
    const parsed = adminUpdateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid data' });
    const { email, currentPassword, newPassword } = parsed.data;
    // @ts-expect-error from middleware
    const uid = req.user.uid;
    const user = await User_1.User.findById(uid);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    if (email && email !== user.email) {
        const exists = await User_1.User.findOne({ email });
        if (exists)
            return res.status(409).json({ error: 'Email already in use' });
        user.email = email;
    }
    if (newPassword) {
        const ok = await (0, auth_1.verifyPassword)(currentPassword, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: 'Current password is incorrect' });
        user.passwordHash = await (0, auth_1.hashPassword)(newPassword);
    }
    await user.save();
    log.info('admin.settings:success');
    return res.json({ ok: true, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
});
exports.default = router;
