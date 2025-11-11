"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrdersCtrl = getAllOrdersCtrl;
exports.getOrderByIdAdminCtrl = getOrderByIdAdminCtrl;
exports.updateOrderStatusCtrl = updateOrderStatusCtrl;
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const adminOrderService_1 = require("../services/adminOrderService");
const zod_1 = require("zod");
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
        errorMap: () => ({ message: 'Invalid status' })
    })
});
async function getAllOrdersCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('admin.orders.getAll:start');
    const status = req.query.status;
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const result = await (0, adminOrderService_1.getAllOrders)({ status, limit, page });
    log.info({ count: result.orders.length, total: result.total }, 'admin.orders.getAll:success');
    return res.json(result);
}
async function getOrderByIdAdminCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('admin.orders.getById:start');
    const { id } = req.params;
    const order = await (0, adminOrderService_1.getOrderByIdAdmin)(id);
    log.info({ orderId: id }, 'admin.orders.getById:success');
    return res.json({ order });
}
async function updateOrderStatusCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('admin.orders.updateStatus:start');
    const { id } = req.params;
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid status', parsed.error.flatten());
    const order = await (0, adminOrderService_1.updateOrderStatus)(id, parsed.data.status);
    log.info({ orderId: id, newStatus: parsed.data.status }, 'admin.orders.updateStatus:success');
    return res.json({ order });
}
