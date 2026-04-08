import { z } from 'zod'

export const NewsCommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  newsId: z.string(),
  authorId: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  }),
})

export const CreateNewsCommentSchema = z.object({
  content: z
    .string()
    .min(10, 'O comentário deve ter pelo menos 10 caracteres')
    .max(1000, 'O comentário não pode exceder 1000 caracteres'),
})

export type NewsComment = z.infer<typeof NewsCommentSchema>
export type CreateNewsCommentData = z.infer<typeof CreateNewsCommentSchema>
