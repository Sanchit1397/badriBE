"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.getCategoryBySlug = getCategoryBySlug;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const Category_1 = require("../models/Category");
const Product_1 = require("../models/Product");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
async function listCategories() {
    logger_1.logger.info('categoryService.listCategories');
    const items = await Category_1.Category.find({}).sort({ name: 1 });
    return items;
}
async function getCategoryBySlug(slug) {
    const cat = await Category_1.Category.findOne({ slug });
    if (!cat)
        throw errors_1.errors.notFound('Category not found');
    return cat;
}
async function createCategory(input) {
    logger_1.logger.info({ slug: input.slug }, 'categoryService.createCategory');
    const exists = await Category_1.Category.findOne({ $or: [{ slug: input.slug }, { name: input.name }] });
    if (exists)
        throw errors_1.errors.conflict('Category already exists');
    const cat = await Category_1.Category.create(input);
    return cat;
}
async function updateCategory(slug, updates) {
    const cat = await Category_1.Category.findOne({ slug });
    if (!cat)
        throw errors_1.errors.notFound('Category not found');
    if (updates.slug) {
        const exists = await Category_1.Category.findOne({ slug: updates.slug });
        if (exists && exists._id.toString() !== cat._id.toString())
            throw errors_1.errors.conflict('Slug already in use');
    }
    Object.assign(cat, updates);
    await cat.save();
    return cat;
}
async function deleteCategory(slug) {
    const cat = await Category_1.Category.findOne({ slug });
    if (!cat)
        throw errors_1.errors.notFound('Category not found');
    const productCount = await Product_1.Product.countDocuments({ categoryId: cat._id });
    if (productCount > 0)
        throw errors_1.errors.conflict('Category has products and cannot be deleted');
    await cat.deleteOne();
    return { ok: true };
}
