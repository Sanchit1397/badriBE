"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminOrderController_1 = require("../controllers/adminOrderController");
const authz_1 = require("../middleware/authz");
const asyncHandler = (fn) => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
const router = (0, express_1.Router)();
// All routes require admin
router.get('/', authz_1.requireAdmin, asyncHandler(adminOrderController_1.getAllOrdersCtrl));
router.get('/:id', authz_1.requireAdmin, asyncHandler(adminOrderController_1.getOrderByIdAdminCtrl));
router.patch('/:id/status', authz_1.requireAdmin, asyncHandler(adminOrderController_1.updateOrderStatusCtrl));
exports.default = router;
