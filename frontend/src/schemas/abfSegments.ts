import { z } from 'zod'

const quarterSchema = z
  .string()
  .regex(/^Q[1-4]$/, 'Trimestre inválido (use Q1, Q2, Q3 ou Q4)')

export const AbfSegmentEntrySchema = z.object({
  id: z.string().optional(),
  year: z.coerce
    .number({ message: 'Ano inválido.' })
    .int('O ano deve ser um número inteiro.')
    .min(1900, 'O ano deve ser maior ou igual a 1900.')
    .max(2100, 'O ano deve ser menor ou igual a 2100.'),
  quarter: quarterSchema,
  segment: z
    .string()
    .min(1, 'Informe o nome do segmento.')
    .max(200, 'O segmento deve ter no máximo 200 caracteres.'),
  acronym: z
    .string()
    .min(1, 'Informe a sigla do segmento.')
    .max(10, 'A sigla deve ter no máximo 10 caracteres.'),
  value: z.coerce
    .number({ message: 'Informe um valor numérico.' })
    .int('O valor deve ser um número inteiro.')
    .nonnegative('O valor deve ser maior ou igual a 0.'),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

export const CreateAbfSegmentSchema = z.object({
  year: z.coerce
    .number({ message: 'Ano inválido.' })
    .int('O ano deve ser um número inteiro.')
    .min(1900, 'O ano deve ser maior ou igual a 1900.')
    .max(2100, 'O ano deve ser menor ou igual a 2100.'),
  quarter: quarterSchema,
  segment: z
    .string()
    .min(1, 'Informe o nome do segmento.')
    .max(200, 'O segmento deve ter no máximo 200 caracteres.'),
  acronym: z
    .string()
    .min(1, 'Informe a sigla do segmento.')
    .max(10, 'A sigla deve ter no máximo 10 caracteres.'),
  value: z.coerce
    .number({ message: 'Informe um valor numérico.' })
    .int('O valor deve ser um número inteiro.')
    .nonnegative('O valor deve ser maior ou igual a 0.'),
})

export const UpdateAbfSegmentSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório para edição'),
  year: z.coerce
    .number({ message: 'Ano inválido.' })
    .int('O ano deve ser um número inteiro.')
    .min(1900, 'O ano deve ser maior ou igual a 1900.')
    .max(2100, 'O ano deve ser menor ou igual a 2100.')
    .optional(),
  quarter: quarterSchema.optional(),
  segment: z
    .string()
    .min(1, 'Informe o nome do segmento.')
    .max(200, 'O segmento deve ter no máximo 200 caracteres.'),
  acronym: z
    .string()
    .min(1, 'Informe a sigla do segmento.')
    .max(10, 'A sigla deve ter no máximo 10 caracteres.'),
  value: z.coerce
    .number({ message: 'Informe um valor numérico.' })
    .int('O valor deve ser um número inteiro.')
    .nonnegative('O valor deve ser maior ou igual a 0.'),
})

export type AbfSegmentEntry = z.infer<typeof AbfSegmentEntrySchema>
export type CreateAbfSegmentType = z.infer<typeof CreateAbfSegmentSchema>
export type UpdateAbfSegmentType = z.infer<typeof UpdateAbfSegmentSchema>
