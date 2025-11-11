"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const authz_1 = require("../middleware/authz");
const asyncHandler = (fn) => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
const router = (0, express_1.Router)();
router.post('/', authz_1.requireAuth, asyncHandler(orderController_1.createOrderCtrl)); // requires auth
router.get('/:id', authz_1.requireAuth, asyncHandler(orderController_1.getOrderByIdCtrl)); // requires auth
exports.default = router;
