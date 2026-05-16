import { z } from 'zod';

export const searchQueryField = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: searchQueryField,
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
