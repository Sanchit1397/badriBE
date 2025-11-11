"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const authz_1 = require("../middleware/authz");
const asyncHandler = (fn) => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
const router = (0, express_1.Router)();
// All profile routes require authentication
router.get('/', authz_1.requireAuth, asyncHandler(profileController_1.getUserProfileCtrl));
router.put('/', authz_1.requireAuth, asyncHandler(profileController_1.updateUserProfileCtrl));
router.post('/change-password', authz_1.requireAuth, asyncHandler(profileController_1.changePasswordCtrl));
router.get('/orders', authz_1.requireAuth, asyncHandler(profileController_1.getUserOrdersCtrl));
exports.default = router;
