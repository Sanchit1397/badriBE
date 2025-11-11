"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const rateLimit_1 = require("../middleware/rateLimit");
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
const router = (0, express_1.Router)();
router.post('/register', asyncHandler(authController_1.register));
router.post('/login', asyncHandler(authController_1.login));
router.get('/verify', asyncHandler(authController_1.verify));
router.post('/resend', (0, rateLimit_1.rateLimit)({ windowMs: 60_000, max: 3 }), asyncHandler(authController_1.resendVerification));
router.post('/forgot', (0, rateLimit_1.rateLimit)({ windowMs: 60_000, max: 3 }), asyncHandler(authController_1.forgotPassword));
router.post('/reset', asyncHandler(authController_1.resetPassword));
exports.default = router;
