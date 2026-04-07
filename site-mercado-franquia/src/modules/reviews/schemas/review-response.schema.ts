import { z } from 'zod';

export const reviewResponseSchema = z.object({
  id: z.number().int().positive(),
  anonymous: z.boolean(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.date(),
  franchiseId: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    cpf: z.string().nullable(),
  }),
  responses: z
    .array(
      z.object({
        id: z.number().int().positive(),
        content: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        author: z.object({
          id: z.string(),
          name: z.string(),
          role: z.enum([
            'ADMIN',
            'FRANCHISOR',
            'FRANCHISEE',
            'CANDIDATE',
            'MEMBER',
          ]),
        }),
      }),
    )
    .optional(),
});

export type ReviewResponseType = z.infer<typeof reviewResponseSchema>;
