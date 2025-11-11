"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const auth_1 = require("../lib/auth");
const logger_1 = require("../lib/logger");
async function requireAuth(req, res, next) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    const header = req.header('Authorization');
    if (!header)
        return res.status(401).json({ error: 'Unauthorized' });
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    const payload = await (0, auth_1.verifyJwt)(token);
    if (!payload)
        return res.status(401).json({ error: 'Unauthorized' });
    // @ts-expect-error attach user
    req.user = payload;
    log.debug({ uid: payload.uid, role: payload.role }, 'requireAuth:ok');
    next();
}
async function requireAdmin(req, res, next) {
    const header = req.header('Authorization');
    if (!header)
        return res.status(401).json({ error: 'Unauthorized' });
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    const payload = await (0, auth_1.verifyJwt)(token);
    if (!payload || payload.role !== 'admin')
        return res.status(403).json({ error: 'Forbidden' });
    // @ts-expect-error attach user
    req.user = payload;
    next();
}
