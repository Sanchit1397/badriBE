"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const uuid_1 = require("uuid");
function requestIdMiddleware(req, res, next) {
    const existing = req.headers['x-request-id'] || req.headers['x-correlation-id'];
    const requestId = existing || (0, uuid_1.v4)();
    // Attach to request headers so log helper can pick it up
    req.headers['x-request-id'] = requestId;
    // Echo back in response header for clients to capture
    res.setHeader('X-Request-Id', requestId);
    next();
}
