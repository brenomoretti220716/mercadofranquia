import { z } from 'zod';

export const createNewsCommentSchema = z.object({
  content: z
    .string()
    .min(10, 'O comentário deve ter pelo menos 10 caracteres')
    .max(1000, 'O comentário não pode exceder 1000 caracteres'),
});

export type CreateNewsCommentType = z.infer<typeof createNewsCommentSchema>;


