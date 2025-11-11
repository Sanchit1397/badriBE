"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderCtrl = createOrderCtrl;
exports.getOrderByIdCtrl = getOrderByIdCtrl;
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const order_1 = require("../validators/order");
const orderService_1 = require("../services/orderService");
async function createOrderCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('order.create:start');
    const parsed = order_1.createOrderSchema.safeParse(req.body);
    if (!parsed.success)
        throw errors_1.errors.unprocessable('Invalid data', parsed.error.flatten());
    const userId = req.user?.uid; // required auth
    if (!userId)
        throw errors_1.errors.unauthorized();
    const order = await (0, orderService_1.createCodOrder)({ userId, ...parsed.data });
    log.info({ orderId: order._id.toString() }, 'order.create:success');
    return res.status(201).json({ order: { _id: order._id.toString(), total: order.total, status: order.status } });
}
async function getOrderByIdCtrl(req, res) {
    const log = (0, logger_1.withRequestContext)(req.headers);
    log.info('order.getById:start');
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId)
        throw errors_1.errors.unauthorized();
    const order = await (0, orderService_1.getOrderById)(id, userId);
    log.info({ orderId: id }, 'order.getById:success');
    return res.json({ order });
}
