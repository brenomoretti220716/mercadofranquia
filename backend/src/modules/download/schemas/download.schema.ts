import { z } from 'zod';

export const downloadImageSchema = z.object({
  imageUrl: z
    .string()
    .url({ message: 'URL da imagem deve ser válida' })
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          return ['http:', 'https:'].includes(parsedUrl.protocol);
        } catch {
          return false;
        }
      },
      { message: 'Apenas URLs HTTP e HTTPS são permitidas' },
    ),
  folder: z.string().optional(),
});

export const downloadMultipleImagesSchema = z.object({
  imageUrls: z
    .array(
      z
        .string()
        .url({ message: 'Todas as URLs devem ser válidas' })
        .refine(
          (url) => {
            try {
              const parsedUrl = new URL(url);
              return ['http:', 'https:'].includes(parsedUrl.protocol);
            } catch {
              return false;
            }
          },
          { message: 'Apenas URLs HTTP e HTTPS são permitidas' },
        ),
    )
    .min(1, { message: 'Pelo menos uma URL é obrigatória' })
    .max(10, { message: 'Máximo de 10 URLs por requisição' }),
  folder: z.string().optional(),
});

export const validateImageUrlSchema = z.object({
  imageUrl: z
    .string()
    .url({ message: 'URL da imagem deve ser válida' })
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          return ['http:', 'https:'].includes(parsedUrl.protocol);
        } catch {
          return false;
        }
      },
      { message: 'Apenas URLs HTTP e HTTPS são permitidas' },
    ),
});

export type DownloadImageType = z.infer<typeof downloadImageSchema>;
export type DownloadMultipleImagesType = z.infer<
  typeof downloadMultipleImagesSchema
>;
export type ValidateImageUrlType = z.infer<typeof validateImageUrlSchema>;
