import { z } from 'zod';

export const createReviewSchema = z.object({
  anonymous: z.boolean().default(false),

  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),

  comment: z
    .string()
    .min(1, 'Comment is required')
    .max(2000, 'Comment must be less than 1000 characters'),
});

export type CreateReviewType = z.infer<typeof createReviewSchema>;
