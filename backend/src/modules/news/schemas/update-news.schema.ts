import { z } from 'zod';
import { validateImageFile } from './file-news.schema';

const stringToBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return value;
};

export const updateNewsSchema = z.object({
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

  isActive: z.unknown().transform(stringToBoolean).pipe(z.boolean()).optional(),
});

export const updateNewsWithFileSchema = updateNewsSchema.extend({
  photo: z
    .unknown()
    .refine(
      validateImageFile,
      'Apenas arquivos JPEG, PNG, GIF e WebP são permitidos (máximo 5MB)',
    )
    .optional(),
});

export type UpdateNewsType = z.infer<typeof updateNewsSchema>;
export type UpdateNewsWithFileType = z.infer<typeof updateNewsWithFileSchema>;
