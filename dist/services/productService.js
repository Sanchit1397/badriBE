"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.getProductBySlug = getProductBySlug;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
// @ts-nocheck
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
async function listProducts(params) {
    logger_1.logger.info({ params }, 'productService.listProducts');
    const { q, category, sort = 'new', page = 1, limit = 12, published } = params;
    const filter = {};
    if (q)
        filter.name = { $regex: q, $options: 'i' };
    if (category) {
        const cat = await Category_1.Category.findOne({ slug: category });
        if (cat)
            filter.categoryId = cat._id;
    }
    if (typeof published === 'boolean')
        filter.published = published;
    const sortSpec = sort === 'price_asc' ? { price: 1 } : sort === 'price_desc' ? { price: -1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        Product_1.Product.find(filter).sort(sortSpec).skip(skip).limit(limit),
        Product_1.Product.countDocuments(filter)
    ]);
    return { items, total, page, limit };
}
async function getProductBySlug(slug) {
    const p = await Product_1.Product.findOne({ slug });
    if (!p)
        throw errors_1.errors.notFound('Product not found');
    return p;
}
async function createProduct(input) {
    logger_1.logger.info({ slug: input.slug }, 'productService.createProduct');
    const exists = await Product_1.Product.findOne({ $or: [{ slug: input.slug }, { name: input.name }] });
    if (exists)
        throw errors_1.errors.conflict('Product already exists');
    const cat = await Category_1.Category.findOne({ slug: input.categorySlug });
    if (!cat)
        throw errors_1.errors.badRequest('Invalid category');
    const p = await Product_1.Product.create({
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        categoryId: cat._id
    });
    return p;
}
async function updateProduct(slug, updates) {
    const p = await Product_1.Product.findOne({ slug });
    if (!p)
        throw errors_1.errors.notFound('Product not found');
    if (updates.slug) {
        const s = await Product_1.Product.findOne({ slug: updates.slug });
        if (s && s._id.toString() !== p._id.toString())
            throw errors_1.errors.conflict('Slug already in use');
    }
    if (updates.categorySlug) {
        const cat = await Category_1.Category.findOne({ slug: updates.categorySlug });
        if (!cat)
            throw errors_1.errors.badRequest('Invalid category');
        updates.categoryId = cat._id;
        delete updates.categorySlug;
    }
    Object.assign(p, updates);
    await p.save();
    return p;
}
async function deleteProduct(slug) {
    const p = await Product_1.Product.findOne({ slug });
    if (!p)
        throw errors_1.errors.notFound('Product not found');
    await p.deleteOne();
    return { ok: true };
}
