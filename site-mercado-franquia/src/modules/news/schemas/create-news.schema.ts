import { z } from 'zod';
import { MulterFile } from '../../upload/dto/multer';
import { validateImageFile } from './file-news.schema';

export const createNewsSchema = z.object({
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
    .min(10, 'O conteúdo deve ter pelo menos 10 caracteres')
    .max(2000, 'não pode passar de 2000'),
});

export const createNewsWithFileSchema = createNewsSchema.extend({
  photo: z
    .unknown()
    .refine(
      (file): file is MulterFile => file !== undefined && file !== null,
      'Foto é obrigatória',
    )
    .refine(
      validateImageFile,
      'Apenas arquivos JPEG, PNG, GIF e WebP são permitidos (máximo 5MB)',
    ),
});

export type CreateNewsType = z.infer<typeof createNewsSchema>;
export type CreateNewsWithFileType = z.infer<typeof createNewsWithFileSchema>;
