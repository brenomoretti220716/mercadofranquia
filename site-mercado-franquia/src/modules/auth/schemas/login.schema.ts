import { z } from 'zod';

// Schema para login do usuário
export const loginSchema = z.object({
  email: z
    .string()
    .email('Formato de e-mail inválido')
    .min(1, 'E-mail é obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});

// Tipo TypeScript inferido do schema
export type LoginType = z.infer<typeof loginSchema>;
