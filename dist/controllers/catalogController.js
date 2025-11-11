"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategoriesCtrl = listCategoriesCtrl;
exports.getCategoryCtrl = getCategoryCtrl;
exports.createCategoryCtrl = createCategoryCtrl;
exports.updateCategoryCtrl = updateCategoryCtrl;
exports.deleteCategoryCtrl = deleteCategoryCtrl;
exports.listProductsCtrl = listProductsCtrl;
exports.getProductCtrl = getProductCtrl;
exports.createProductCtrl = createProductCtrl;
exports.updateProductCtrl = updateProductCtrl;
exports.deleteProductCtrl = deleteProductCtrl;
const logger_1 = require("../lib/logger");
const errors_1 = require("../lib/errors");
const catalog_1 = require("../validators/catalog");
const categoryService_1 = require("../services/categoryService");
const productService_1 = require("../services/productService");
// Categories
async function listCategoriesCtrl(_req, res) {
    const items = await (0, categoryService_1.listCategories)();
    return res.json({ items });
}
async function getCategoryCtrl(req, res) {
    const slug = req.params.slug;
    const cat = await (0, categoryService_1.getCategoryBySlug)(slug);
    return res.json({ category: cat });
}
async function createCategoryCtrl(req, res) {
    const parsed = catalog_1.createCategorySchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const cat = await (0, categoryService_1.createCategory)(parsed.data);
    return res.status(201).json({ category: cat });
}
async function updateCategoryCtrl(req, res) {
    const slug = req.params.slug;
    const parsed = catalog_1.updateCategorySchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const cat = await (0, categoryService_1.updateCategory)(slug, parsed.data);
    return res.json({ category: cat });
}
async function deleteCategoryCtrl(req, res) {
    const slug = req.params.slug;
    const ok = await (0, categoryService_1.deleteCategory)(slug);
    return res.json(ok);
}
// Products
async function listProductsCtrl(req, res) {
    const parsed = catalog_1.listProductsQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid query', parsed.error.flatten());
    const result = await (0, productService_1.listProducts)(parsed.data);
    return res.json(result);
}
async function getProductCtrl(req, res) {
    const slug = req.params.slug;
    const p = await (0, productService_1.getProductBySlug)(slug);
    return res.json({ product: p });
}
async function createProductCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    const parsed = catalog_1.createProductSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const p = await (0, productService_1.createProduct)(parsed.data);
    log.info({ slug: p.slug }, 'createProduct:success');
    return res.status(201).json({ product: p });
}
async function updateProductCtrl(req, res) {
    const slug = req.params.slug;
    const parsed = catalog_1.updateProductSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const p = await (0, productService_1.updateProduct)(slug, parsed.data);
    return res.json({ product: p });
}
async function deleteProductCtrl(req, res) {
    const slug = req.params.slug;
    const ok = await (0, productService_1.deleteProduct)(slug);
    return res.json(ok);
}
