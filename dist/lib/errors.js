"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = exports.AppError = void 0;
exports.errorMiddleware = errorMiddleware;
const logger_1 = require("./logger");
class AppError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
exports.AppError = AppError;
function errorMiddleware(err, _req, res, _next) {
    if (err instanceof AppError) {
        try {
            const log = (0, logger_1.withRequestContext)(_req.headers);
            log.warn({ code: err.code, status: err.status, details: err.details }, 'AppError');
        }
        catch { }
        return res.status(err.status).json({ code: err.code, error: err.message, details: err.details });
    }
    // Handle common DB errors
    if (typeof err === 'object' && err && err.code === 11000) {
        return res.status(409).json({ code: 'CONFLICT', error: 'Duplicate key', details: err.keyValue });
    }
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Something went wrong' });
}
exports.errors = {
    badRequest: (message = 'Invalid request', details) => new AppError(400, 'BAD_REQUEST', message, details),
    unauthorized: (message = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', message),
    forbidden: (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message),
    notFound: (message = 'Not found') => new AppError(404, 'NOT_FOUND', message),
    conflict: (message = 'Conflict') => new AppError(409, 'CONFLICT', message),
    unprocessable: (message = 'Unprocessable entity', details) => new AppError(422, 'UNPROCESSABLE_ENTITY', message, details)
};
