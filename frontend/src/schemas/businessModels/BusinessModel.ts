import { z } from 'zod'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

type FileLike = {
  size: number
  type: string
}

const isFileLike = (file: unknown): file is FileLike => {
  return (
    typeof file === 'object' &&
    file !== null &&
    'size' in file &&
    typeof (file as { size?: unknown }).size === 'number' &&
    'type' in file &&
    typeof (file as { type?: unknown }).type === 'string'
  )
}

const fileSchema = z
  .custom<File>(
    (file) => {
      if (!file) {
        return false
      }

      if (typeof File !== 'undefined' && file instanceof File) {
        return true
      }

      return isFileLike(file)
    },
    { message: 'Foto é obrigatória' },
  )
  .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
    message: 'A foto deve ter no máximo 5MB',
  })
  .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: 'Formato inválido. Use: JPEG, PNG, GIF ou WebP',
  })

export const BusinessModelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  photo: fileSchema,
})

export const UpdateBusinessModelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  description: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .optional(),
  photo: fileSchema.optional(),
})

export type BusinessModelInput = z.infer<typeof BusinessModelSchema>
export type UpdateBusinessModelInput = z.infer<typeof UpdateBusinessModelSchema>
