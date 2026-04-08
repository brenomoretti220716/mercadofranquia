import { z } from 'zod';

export const createRankingBigNumberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  position: z.number().int().min(1).max(4),
  growthPercentage: z.number().min(-999.99).max(999.99),
  year: z.number().int().min(2000).max(2100).optional(),
});

export type CreateRankingBigNumberType = z.infer<
  typeof createRankingBigNumberSchema
>;
