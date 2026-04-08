import { z } from 'zod';

// Schema para arquivo Multer
export const multerFileSchema = z.object({
  fieldname: z.string().min(1, { message: 'Nome do campo é obrigatório' }),
  originalname: z
    .string()
    .min(1, { message: 'Nome original do arquivo é obrigatório' }),
  encoding: z
    .string()
    .min(1, { message: 'Codificação do arquivo é obrigatória' }),
  mimetype: z.string().min(1, { message: 'Tipo MIME é obrigatório' }),
  size: z
    .number()
    .positive({ message: 'Tamanho do arquivo deve ser positivo' }),
  destination: z.string().optional(),
  filename: z.string().optional(),
  path: z.string().optional(),
  buffer: z.instanceof(Buffer, { message: 'Buffer do arquivo é obrigatório' }),
});

// Schema para informações do arquivo
export const fileInfoSchema = z.object({
  exists: z.boolean(),
  size: z.number().positive().optional(),
  mimeType: z.string().optional(),
});

// Schema para configuração de upload
export const uploadConfigSchema = z.object({
  folder: z
    .string()
    .min(1, { message: 'Pasta de destino é obrigatória' })
    .default('news'),
  maxSize: z
    .number()
    .positive()
    .default(5 * 1024 * 1024), // 5MB
  allowedTypes: z
    .array(z.string())
    .default([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]),
});

// Schema para resultado de upload
export const uploadResultSchema = z.object({
  success: z.boolean(),
  url: z.string().url({ message: 'URL deve ser válida' }),
  fileName: z.string().min(1, { message: 'Nome do arquivo é obrigatório' }),
  size: z.number().positive(),
  mimeType: z.string(),
});

// Schema para resultado de upload múltiplo
export const multipleUploadResultSchema = z.object({
  success: z.boolean(),
  results: z.array(uploadResultSchema),
  failed: z
    .array(
      z.object({
        fileName: z.string(),
        error: z.string(),
      }),
    )
    .optional(),
});

// Tipos TypeScript inferidos dos schemas
export type MulterFileType = z.infer<typeof multerFileSchema>;
export type FileInfoType = z.infer<typeof fileInfoSchema>;
export type UploadConfigType = z.infer<typeof uploadConfigSchema>;
export type UploadResultType = z.infer<typeof uploadResultSchema>;
export type MultipleUploadResultType = z.infer<
  typeof multipleUploadResultSchema
>;
