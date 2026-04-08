import { isValidCPF } from '@/src/utils/formaters'
import { z } from 'zod'

const ReviewAuthorRoleEnum = z.enum([
  'ADMIN',
  'FRANCHISOR',
  'FRANCHISEE',
  'CANDIDATE',
  'MEMBER',
])

// Schema para criar uma nova review
export const CreateReviewSchema = z.object({
  authorName: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase()
    .trim(),

  cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .transform((cpf) => cpf.replace(/\D/g, '')) // Remove caracteres não numéricos
    .refine((cpf) => cpf.length === 11, 'CPF deve ter 11 dígitos')
    .refine((cpf) => isValidCPF(cpf), 'CPF inválido'),

  anonymous: z.boolean(),

  rating: z
    .number()
    .int('Avaliação deve ser um número inteiro')
    .min(1, 'Avaliação deve ser no mínimo 1 estrela')
    .max(5, 'Avaliação deve ser no máximo 5 estrelas'),

  comment: z
    .string()
    .min(10, 'Comentário deve ter pelo menos 10 caracteres')
    .max(2000, 'Comentário deve ter no máximo 2000 caracteres')
    .trim(),

  franchiseId: z.string().min(1, 'ID da franquia é obrigatório'),
})

// ✅ Schema para respostas dos franqueadores
export const ReviewResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  reviewId: z.number(),
  authorId: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  }),
})

export const ReviewSchema = z.object({
  id: z.number(),
  authorName: z.string(),
  email: z.string().optional(),
  cpf: z.string().optional(),
  anonymous: z.boolean(),
  isFranchisee: z.boolean().default(false), // ✅ Adicionado campo isFranchisee
  rating: z.number().min(1).max(5),
  comment: z.string(),
  createdAt: z.string(),
  franchiseId: z.string().optional(),
  isActive: z.boolean().default(true), // ✅ Adicionado campo isActive
  responses: z.array(ReviewResponseSchema).optional(), // ✅ Adicionado campo responses
  franchise: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
  }),
})

export const ReviewsListSchema = z.object({
  data: z.array(ReviewSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
})

const ReviewFranchiseSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const ReviewAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  cpf: z.string().nullable(),
})

export const UserReviewResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  author: z.object({
    id: z.string(),
    name: z.string(),
    role: ReviewAuthorRoleEnum,
  }),
})

export const UserReviewSchema = z.object({
  id: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  anonymous: z.boolean(),
  createdAt: z.string(),
  isActive: z.boolean(),
  isFranchisee: z.boolean(),
  franchise: ReviewFranchiseSchema,
  author: ReviewAuthorSchema,
  responses: z.array(UserReviewResponseSchema).default([]),
})

export const UserReviewListSchema = z.object({
  data: z.array(UserReviewSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  lastPage: z.number(),
})

// Schema para filtros de busca de reviews
export const ReviewFiltersSchema = z.object({
  franchiseId: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  anonymous: z.boolean().optional(),
  isActive: z.boolean().optional(), // ✅ Filtro por status ativo/inativo
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(10).optional(),
  orderBy: z
    .enum(['createdAt', 'rating', 'isActive'])
    .default('createdAt')
    .optional(), // ✅ Ordenação por isActive
  order: z.enum(['asc', 'desc']).default('desc').optional(),
})

// ✅ Schema para alternar status da review (Admin)
export const ToggleReviewStatusSchema = z.object({
  isActive: z.boolean(),
})

// ✅ Schema para criar resposta do franqueador
export const CreateReviewResponseSchema = z.object({
  content: z
    .string()
    .min(10, 'Resposta deve ter pelo menos 10 caracteres')
    .max(1000, 'Resposta deve ter no máximo 1000 caracteres')
    .trim(),

  reviewId: z.number().int().positive('ID da review é obrigatório'),
})

// ✅ Schema para atualizar resposta do franqueador
export const UpdateReviewResponseSchema = z.object({
  content: z
    .string()
    .min(10, 'Resposta deve ter pelo menos 10 caracteres')
    .max(1000, 'Resposta deve ter no máximo 1000 caracteres')
    .trim(),
})

// Tipos TypeScript inferidos dos schemas
export type CreateReviewData = z.infer<typeof CreateReviewSchema>
export type Review = z.infer<typeof ReviewSchema>
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>
export type ReviewsList = z.infer<typeof ReviewsListSchema>
export type UserReview = z.infer<typeof UserReviewSchema>
export type UserReviewResponse = z.infer<typeof UserReviewResponseSchema>
export type UserReviewList = z.infer<typeof UserReviewListSchema>
export type ReviewFilters = z.infer<typeof ReviewFiltersSchema>
export type ToggleReviewStatusData = z.infer<typeof ToggleReviewStatusSchema>
export type CreateReviewResponseData = z.infer<
  typeof CreateReviewResponseSchema
>
export type UpdateReviewResponseData = z.infer<
  typeof UpdateReviewResponseSchema
>

// Types derived from reviews used in UI
export type ReviewCard = {
  text: string
  name: string
  franchise?: string
  franchiseSlug?: string
  date: string
  initials: string
  rating: number
}

export type ApiReview = Review

// ✅ Schema para validação no frontend (sem franchiseId, pois vem da URL)
export const CreateReviewFormSchema = CreateReviewSchema.omit({
  franchiseId: true,
})
export type CreateReviewFormData = z.infer<typeof CreateReviewFormSchema>

// ✅ Schema para usuários autenticados (sem dados pessoais, pois vêm do token)
export const CreateAuthenticatedReviewSchema = z.object({
  anonymous: z.boolean(),

  rating: z
    .number()
    .int('Avaliação deve ser um número inteiro')
    .min(1, 'Avaliação deve ser no mínimo 1 estrela')
    .max(5, 'Avaliação deve ser no máximo 5 estrelas'),

  comment: z
    .string()
    .min(10, 'Comentário deve ter pelo menos 10 caracteres')
    .max(2000, 'Comentário deve ter no máximo 2000 caracteres')
    .trim(),

  franchiseId: z.string().min(1, 'ID da franquia é obrigatório'),
})

// ✅ Schema para validação no frontend para usuários autenticados (sem franchiseId, pois vem da URL)
export const CreateAuthenticatedReviewFormSchema =
  CreateAuthenticatedReviewSchema.omit({ franchiseId: true })
export type CreateAuthenticatedReviewFormData = z.infer<
  typeof CreateAuthenticatedReviewFormSchema
>

// Schema para estatísticas de reviews (útil para dashboards)
export const ReviewStatsSchema = z.object({
  totalReviews: z.number(),
  activeReviews: z.number(), // ✅ Contagem de reviews ativas
  inactiveReviews: z.number(), // ✅ Contagem de reviews inativas
  averageRating: z.number(),
  ratingDistribution: z.object({
    1: z.number(),
    2: z.number(),
    3: z.number(),
    4: z.number(),
    5: z.number(),
  }),
  anonymousCount: z.number(),
  publicCount: z.number(),
})

export type ReviewStats = z.infer<typeof ReviewStatsSchema>

// Validações auxiliares
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')
  return cleanCPF.length === 11 && isValidCPF(cleanCPF)
}

export const validateRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
}

export const validateComment = (comment: string): boolean => {
  const trimmedComment = comment.trim()
  return trimmedComment.length >= 10 && trimmedComment.length <= 2000
}

// ✅ Validação para conteúdo de resposta
export const validateResponseContent = (content: string): boolean => {
  const trimmedContent = content.trim()
  return trimmedContent.length >= 10 && trimmedContent.length <= 1000
}

// Schema para atualização de review (caso seja necessário no futuro)
export const UpdateReviewSchema = z.object({
  rating: z
    .number()
    .int('Avaliação deve ser um número inteiro')
    .min(1, 'Avaliação deve ser no mínimo 1 estrela')
    .max(5, 'Avaliação deve ser no máximo 5 estrelas')
    .optional(),

  comment: z
    .string()
    .min(10, 'Comentário deve ter pelo menos 10 caracteres')
    .max(2000, 'Comentário deve ter no máximo 2000 caracteres')
    .trim()
    .optional(),

  anonymous: z.boolean().optional(),

  isActive: z.boolean().optional(), // ✅ Permitir atualização do status
})

export type UpdateReviewData = z.infer<typeof UpdateReviewSchema>
