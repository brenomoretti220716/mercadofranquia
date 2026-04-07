import { z } from 'zod';

// Schema para template de email
export const emailTemplateSchema = z.object({
  to: z.string().email({ message: 'Email de destino deve ser válido' }),
  subject: z.string().min(1, { message: 'Assunto é obrigatório' }),
  template: z.string().min(1, { message: 'Template é obrigatório' }),
  context: z.record(z.unknown()),
});

// Schema para dados de notificação de atualização do usuário
export const userUpdateNotificationDataSchema = z.object({
  userEmail: z.string().email({ message: 'Email do usuário deve ser válido' }),
  userName: z.string().min(1, { message: 'Nome do usuário é obrigatório' }),
});

// Schema para configuração de email
export const emailConfigSchema = z.object({
  SMTP_HOST: z.string().min(1, { message: 'Host SMTP é obrigatório' }),
  SMTP_PORT: z
    .number()
    .int()
    .positive({ message: 'Porta SMTP deve ser um número positivo' }),
  SMTP_SECURE: z.string(),
  SMTP_USER: z.string().min(1, { message: 'Usuário SMTP é obrigatório' }),
  SMTP_PASS: z.string().min(1, { message: 'Senha SMTP é obrigatória' }),
  SMTP_FROM: z.string().email({ message: 'Email de origem deve ser válido' }),
});

// Tipos TypeScript inferidos dos schemas
export type EmailTemplateType = z.infer<typeof emailTemplateSchema>;
export type UserUpdateNotificationDataType = z.infer<
  typeof userUpdateNotificationDataSchema
>;
export type EmailConfigType = z.infer<typeof emailConfigSchema>;
