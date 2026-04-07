import { z } from 'zod';

// Schema para solicitar reset de senha
export const forgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .email('Formato de e-mail inválido')
    .min(1, 'E-mail é obrigatório'),
});

// Schema para verificar código de reset
export const verifyResetCodeSchema = z.object({
  email: z
    .string()
    .email('Formato de e-mail inválido')
    .min(1, 'E-mail é obrigatório'),
  code: z
    .string()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d+$/, 'Código deve conter apenas números'),
});

// Schema para resetar senha
export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .email('Formato de e-mail inválido')
      .min(1, 'E-mail é obrigatório'),
    code: z
      .string()
      .length(6, 'Código deve ter 6 dígitos')
      .regex(/^\d+$/, 'Código deve conter apenas números'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

// Tipos TypeScript inferidos dos schemas
export type ForgotPasswordRequestDto = z.infer<
  typeof forgotPasswordRequestSchema
>;
export type VerifyResetCodeDto = z.infer<typeof verifyResetCodeSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
