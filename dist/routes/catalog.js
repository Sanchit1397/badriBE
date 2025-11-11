"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authz_1 = require("../middleware/authz");
const catalogController_1 = require("../controllers/catalogController");
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
const router = (0, express_1.Router)();
// Public endpoints
router.get('/categories', asyncHandler(catalogController_1.listCategoriesCtrl));
router.get('/categories/:slug', asyncHandler(catalogController_1.getCategoryCtrl));
router.get('/products', asyncHandler(catalogController_1.listProductsCtrl));
router.get('/products/:slug', asyncHandler(catalogController_1.getProductCtrl));
// Admin endpoints
router.post('/categories', authz_1.requireAdmin, asyncHandler(catalogController_1.createCategoryCtrl));
router.put('/categories/:slug', authz_1.requireAdmin, asyncHandler(catalogController_1.updateCategoryCtrl));
router.delete('/categories/:slug', authz_1.requireAdmin, asyncHandler(catalogController_1.deleteCategoryCtrl));
router.post('/products', authz_1.requireAdmin, asyncHandler(catalogController_1.createProductCtrl));
router.put('/products/:slug', authz_1.requireAdmin, asyncHandler(catalogController_1.updateProductCtrl));
router.delete('/products/:slug', authz_1.requireAdmin, asyncHandler(catalogController_1.deleteProductCtrl));
exports.default = router;
