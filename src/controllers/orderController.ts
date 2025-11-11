import type { Request, Response } from 'express';
import { errors } from '../lib/errors';
import { withRequestContext } from '../lib/logger';
import { createOrderSchema } from '../validators/order';
import { createCodOrder, getOrderById } from '../services/orderService';

export async function createOrderCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('order.create:start');
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) throw errors.unprocessable('Invalid data', parsed.error.flatten());
  const userId = (req as any).user?.uid; // required auth
  if (!userId) throw errors.unauthorized();
  const order = await createCodOrder({ userId, ...parsed.data });
  log.info({ orderId: order._id.toString() }, 'order.create:success');
  return res.status(201).json({ order: { _id: order._id.toString(), total: order.total, status: order.status } });
}

export async function getOrderByIdCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('order.getById:start');
  const { id } = req.params;
  const userId = (req as any).user?.uid;
  if (!userId) throw errors.unauthorized();
  const order = await getOrderById(id, userId);
  log.info({ orderId: id }, 'order.getById:success');
  return res.json({ order });
}


