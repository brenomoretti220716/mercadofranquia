import { z } from 'zod';

export const updateRankingBigNumberSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    position: z.number().int().min(1).max(4).optional(),
    growthPercentage: z.number().min(-999.99).max(999.99).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export type UpdateRankingBigNumberType = z.infer<
  typeof updateRankingBigNumberSchema
>;
