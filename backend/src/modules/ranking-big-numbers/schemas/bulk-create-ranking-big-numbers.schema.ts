import { z } from 'zod';

const cardSchema = z.object({
  position: z.number().int().min(1).max(4),
  name: z.string().trim().min(1).max(120),
  growthPercentage: z.number().min(-999.99).max(999.99),
});

export const bulkCreateRankingBigNumbersSchema = z
  .object({
    year: z.number().int().min(2000).max(2100),
    cards: z.array(cardSchema).length(4),
  })
  .refine(
    (value) => {
      const positions = value.cards
        .map((c) => c.position)
        .sort((a, b) => a - b);
      return JSON.stringify(positions) === JSON.stringify([1, 2, 3, 4]);
    },
    {
      message: 'Cards must have positions exactly 1, 2, 3 and 4.',
      path: ['cards'],
    },
  );

export type BulkCreateRankingBigNumbersType = z.infer<
  typeof bulkCreateRankingBigNumbersSchema
>;
