import { z } from 'zod';

export const updateReviewResponseSchema = z.object({
  content: z
    .string()
    .min(10, 'A resposta deve ter pelo menos 10 caracteres')
    .max(1000, 'A resposta não pode exceder 1000 caracteres')
    .optional(),
});

export type UpdateReviewResponseType = z.infer<
  typeof updateReviewResponseSchema
>;
