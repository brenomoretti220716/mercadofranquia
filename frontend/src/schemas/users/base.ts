import { stripNonDigits } from '@/src/utils/formaters'
import { z } from 'zod'

/**
 * Base schemas for user registration and profile management
 * These are used as building blocks for admin and regular user schemas
 */

// ============================================================================
// BASE REGISTRATION - STEP ONE (Basic Info)
// ============================================================================

export const BaseStepOneRegistrationSchema = z.object({
  name: z.string().min(1, 'Esse campo é obrigatório'),
  email: z
    .string({ required_error: 'Esse campo é obrigatório' })
    .min(1, { message: 'Esse campo é obrigatório' })
    .email({
      message: 'Essa dado é inválido. Tente novamente.',
    }),
  phone: z
    .string({ required_error: 'Esse campo é obrigatório' })
    .min(1, { message: 'Esse campo é obrigatório' })
    .refine(
      (val) => {
        const digits = stripNonDigits(val)
        return digits.length === 10 || digits.length === 11 // 10 or 11 digits for Brazilian phone
      },
      { message: 'Telefone deve ter 10 ou 11 dígitos' },
    ),
  password: z
    .string({
      required_error: 'Esse campo é obrigatório',
    })
    .min(6, { message: 'Mínimo de 6 caracteres' })
    .regex(/[A-Z]/, { message: 'Pelo menos uma letra maiúscula' })
    .regex(/[0-9]/, { message: 'Pelo menos um número' }),
  confirmPassword: z
    .string({
      required_error: 'Confirmação de senha obrigatória.',
    })
    .min(1, { message: 'Confirmação de senha obrigatória.' }),
})

// ============================================================================
// BASE REGISTRATION - STEP TWO (Profile Completion)
// ============================================================================

export const BaseStepTwoRegistrationSchema = z.object({
  role: z
    .string()
    .min(1, 'Selecione uma opção')
    .refine(
      (val) =>
        ['FRANCHISEE', 'CANDIDATE', 'ENTHUSIAST', 'FRANCHISOR'].includes(val),
      { message: 'Selecione uma opção válida' },
    ) as z.ZodType<'FRANCHISEE' | 'CANDIDATE' | 'ENTHUSIAST' | 'FRANCHISOR'>,
  city: z.string().min(1, 'Cidade é obrigatória'),
  interestSectors: z.string().min(1, 'Setores de interesse são obrigatórios'),
  interestRegion: z.string().min(1, 'Região de interesse é obrigatória'),
  investmentRange: z.string().min(1, 'Faixa de investimento é obrigatória'),
  franchiseeOf: z.array(z.string().cuid('Invalid franchise ID')).optional(),
})
