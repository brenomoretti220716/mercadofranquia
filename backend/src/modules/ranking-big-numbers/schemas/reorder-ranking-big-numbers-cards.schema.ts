import { z } from 'zod';

export const reorderRankingBigNumbersSchema = z.object({
  year: z.number().int().min(2000).max(2100).optional(),
  cards: z
    .array(
      z.object({
        id: z.string().min(1),
        position: z.number().int().min(1).max(4),
      }),
    )
    .length(4),
});

export type ReorderRankingBigNumbersType = z.infer<
  typeof reorderRankingBigNumbersSchema
>;
