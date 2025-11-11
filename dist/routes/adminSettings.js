"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const authz_1 = require("../middleware/authz");
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
const router = (0, express_1.Router)();
// All routes require admin authentication
router.use(authz_1.requireAdmin);
// Cache stats (monitoring)
router.get('/cache/stats', asyncHandler(settingsController_1.getCacheStatsCtrl));
// Category-based retrieval
router.get('/category/:category', asyncHandler(settingsController_1.getSettingsByCategoryCtrl));
// CRUD operations
router.get('/', asyncHandler(settingsController_1.getAllSettingsCtrl));
router.get('/:key', asyncHandler(settingsController_1.getSettingCtrl));
router.put('/:key', asyncHandler(settingsController_1.updateSettingCtrl));
router.post('/', asyncHandler(settingsController_1.createSettingCtrl));
router.delete('/:key', asyncHandler(settingsController_1.deleteSettingCtrl));
exports.default = router;
