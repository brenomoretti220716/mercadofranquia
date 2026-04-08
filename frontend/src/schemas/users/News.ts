import { z } from 'zod'

const hasFileApi = typeof File !== 'undefined'

const isFileInstance = (value: unknown): value is File => {
  if (!hasFileApi) {
    return true
  }

  return value instanceof File
}

// Schema base para notícias
export const NewsSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(200, 'O título não pode exceder 200 caracteres'),
  category: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(100, 'A categoria não pode exceder 100 caracteres'),
  summary: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(500, 'O resumo não pode exceder 500 caracteres'),
  content: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
  photoUrl: z.string().url('A foto deve ser uma URL válida').or(z.literal('')),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
})

// Schema para REGISTRO (criação)
export const CreateNewsSchema = z.object({
  title: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(200, 'O título não pode exceder 200 caracteres'),
  category: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(100, 'A categoria não pode exceder 100 caracteres'),
  summary: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(500, 'O resumo não pode exceder 500 caracteres'),
  content: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
  photo: z
    .any()
    .refine(
      (file) => file !== undefined && isFileInstance(file),
      'Arquivo é obrigatório',
    )
    .refine(
      (file) =>
        !hasFileApi || (file instanceof File && file.size <= 5 * 1024 * 1024), // 5MB
      'O arquivo deve ter no máximo 5MB',
    )
    .refine(
      (file) =>
        !hasFileApi ||
        (file instanceof File &&
          [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
          ].includes(file.type)),
      'Apenas arquivos JPEG, PNG, GIF e WebP são permitidos',
    ),
})

export const UpdateNewsSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório para edição'),
  title: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(200, 'O título não pode exceder 200 caracteres')
    .optional(),
  category: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(100, 'A categoria não pode exceder 100 caracteres')
    .optional(),
  summary: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .max(500, 'O resumo não pode exceder 500 caracteres')
    .optional(),
  content: z
    .string()
    .min(1, 'Esse campo é obrigatório.')
    .min(10, 'O conteúdo deve ter pelo menos 10 caracteres')
    .optional(),
  photo: z
    .any()
    .optional()
    .refine(
      (file) =>
        file === undefined || !hasFileApi || (file && isFileInstance(file)),
      'Arquivo inválido',
    )
    .refine(
      (file) =>
        file === undefined ||
        !hasFileApi ||
        (file instanceof File && file.size <= 5 * 1024 * 1024), // 5MB
      'O arquivo deve ter no máximo 5MB',
    )
    .refine(
      (file) =>
        file === undefined ||
        !hasFileApi ||
        (file instanceof File &&
          [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
          ].includes(file.type)),
      'Apenas arquivos JPEG, PNG, GIF e WebP são permitidos',
    ), // Foto é opcional na edição
  isActive: z.boolean().optional(),
})

// Tipos TypeScript
export type NewsSchema = z.infer<typeof NewsSchema>
export type CreateNewsSchema = z.infer<typeof CreateNewsSchema>
export type UpdateNewsSchema = z.infer<typeof UpdateNewsSchema>
