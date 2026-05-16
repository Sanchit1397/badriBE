import { z } from 'zod';
import { paginationQuerySchema } from './pagination';

export const listAdminOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
});
