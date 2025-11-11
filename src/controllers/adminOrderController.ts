import type { Request, Response } from 'express';
import { errors } from '../lib/errors';
import { withRequestContext } from '../lib/logger';
import { getAllOrders, getOrderByIdAdmin, updateOrderStatus } from '../services/adminOrderService';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid status' })
  })
});

export async function getAllOrdersCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('admin.orders.getAll:start');
  
  const status = req.query.status as string | undefined;
  const limit = parseInt(req.query.limit as string) || 50;
  const page = parseInt(req.query.page as string) || 1;
  
  const result = await getAllOrders({ status, limit, page });
  log.info({ count: result.orders.length, total: result.total }, 'admin.orders.getAll:success');
  
  return res.json(result);
}

export async function getOrderByIdAdminCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('admin.orders.getById:start');
  
  const { id } = req.params;
  const order = await getOrderByIdAdmin(id);
  log.info({ orderId: id }, 'admin.orders.getById:success');
  
  return res.json({ order });
}

export async function updateOrderStatusCtrl(req: Request, res: Response) {
  const log = withRequestContext(req.headers as any);
  log.info('admin.orders.updateStatus:start');
  
  const { id } = req.params;
  const parsed = updateStatusSchema.safeParse(req.body);
  
  if (!parsed.success) throw errors.unprocessable('Invalid status', parsed.error.flatten());
  
  const order = await updateOrderStatus(id, parsed.data.status);
  log.info({ orderId: id, newStatus: parsed.data.status }, 'admin.orders.updateStatus:success');
  
  return res.json({ order });
}

