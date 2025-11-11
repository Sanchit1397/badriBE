"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
function rateLimit(opts) {
    const { windowMs, max, keyGenerator } = opts;
    const store = new Map();
    function cleanup(now) {
        for (const [k, v] of store) {
            if (v.expiresAt <= now)
                store.delete(k);
        }
    }
    return function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        cleanup(now);
        const key = (keyGenerator ? keyGenerator(req) : req.ip) + ':' + req.path;
        const current = store.get(key);
        if (!current || current.expiresAt <= now) {
            store.set(key, { count: 1, expiresAt: now + windowMs });
            return next();
        }
        if (current.count >= max) {
            const retryAfter = Math.ceil((current.expiresAt - now) / 1000);
            res.setHeader('Retry-After', String(retryAfter));
            return res.status(429).json({ code: 'TOO_MANY_REQUESTS', error: 'Too many requests. Please try again later.' });
        }
        current.count += 1;
        store.set(key, current);
        return next();
    };
}
