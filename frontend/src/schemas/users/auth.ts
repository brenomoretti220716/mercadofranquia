import { isValidCPF, stripNonDigits } from '@/src/utils/formaters'
import { z } from 'zod'
import {
  BaseStepOneRegistrationSchema,
  BaseStepTwoRegistrationSchema,
} from './base'

// ============================================================================
// LOGIN
// ============================================================================

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Esse campo é obrigatório.' })
    .min(1, { message: 'Esse campo é obrigatório.' })
    .email({
      message: 'Essa dado é inválido. Tente novamente.',
    }),
  password: z
    .string({
      required_error: 'Senha inválida.',
    })
    .min(1, { message: 'Senha inválida.' }),
})

export type LoginInput = z.infer<typeof LoginSchema>

// ============================================================================
// REGULAR USER REGISTRATION - STEP ONE (Email & Password)
// ============================================================================

export const StepOneRegistrationSchema = z
  .object({
    email: z
      .string({ required_error: 'Esse campo é obrigatório' })
      .min(1, { message: 'Esse campo é obrigatório' })
      .email({
        message: 'Essa dado é inválido. Tente novamente.',
      }),
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
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type StepOneRegistrationInput = z.infer<typeof StepOneRegistrationSchema>

// ============================================================================
// REGULAR USER REGISTRATION - STEP TWO (Name & Phone)
// ============================================================================

export const StepTwoRegistrationBasicSchema = z.object({
  name: z.string().min(1, 'Esse campo é obrigatório'),
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
})

export type StepTwoRegistrationBasicInput = z.infer<
  typeof StepTwoRegistrationBasicSchema
>

// ============================================================================
// REGULAR USER REGISTRATION - COMBINED (for final submission)
// ============================================================================

export const CombinedRegistrationInput = z
  .object({
    email: z
      .string({ required_error: 'Esse campo é obrigatório' })
      .min(1, { message: 'Esse campo é obrigatório' })
      .email({
        message: 'Essa dado é inválido. Tente novamente.',
      }),
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
    name: z.string().min(1, 'Esse campo é obrigatório'),
    phone: z
      .string({ required_error: 'Esse campo é obrigatório' })
      .min(1, { message: 'Esse campo é obrigatório' })
      .refine(
        (val) => {
          const digits = stripNonDigits(val)
          return digits.length === 10 || digits.length === 11
        },
        { message: 'Telefone deve ter 10 ou 11 dígitos' },
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type CombinedRegistrationInputType = z.infer<
  typeof CombinedRegistrationInput
>

// ============================================================================
// REGULAR USER REGISTRATION - STEP TWO
// ============================================================================

export const StepTwoRegistrationSchema = BaseStepTwoRegistrationSchema.refine(
  (data) => {
    if (data.role === 'FRANCHISEE') {
      return data.franchiseeOf && data.franchiseeOf.length > 0
    }
    return true
  },
  {
    message: 'Selecione pelo menos uma franquia',
    path: ['franchiseeOf'],
  },
)

export type StepTwoRegistrationInput = z.infer<typeof StepTwoRegistrationSchema>

// ============================================================================
// ADMIN REGISTRATION - STEP ONE
// ============================================================================

export const AdminRegisterSchema = BaseStepOneRegistrationSchema.extend({
  cpf: z
    .string({ required_error: 'Esse campo é obrigatório' })
    .min(1, { message: 'Esse campo é obrigatório' })
    .refine((val) => isValidCPF(val), { message: 'CPF inválido' }),
})

export type AdminRegisterInput = z.infer<typeof AdminRegisterSchema>

// ============================================================================
// ADMIN EDITING
// ============================================================================

export const AdminEditingSchema = BaseStepOneRegistrationSchema.extend({
  isActive: z.boolean().default(true).optional(),
  cpf: z
    .string({ required_error: 'Esse campo é obrigatório' })
    .min(1, { message: 'Esse campo é obrigatório' })
    .refine((val) => isValidCPF(val), { message: 'CPF inválido' }),
}).partial()

export type AdminEditingInput = z.infer<typeof AdminEditingSchema>

// ============================================================================
// ADMIN REGISTRATION - STEP TWO
// ============================================================================

export const adminStepTwoRegistrationSchema =
  BaseStepTwoRegistrationSchema.extend({
    isActive: z.boolean().default(true).optional(),
  }).partial()

export type AdminStepTwoRegistrationInput = z.infer<
  typeof adminStepTwoRegistrationSchema
>

// ============================================================================
// FORGOT PASSWORD
// ============================================================================

export const ForgotPasswordEmailSchema = z.object({
  email: z
    .string({ required_error: 'Esse campo é obrigatório.' })
    .min(1, { message: 'Esse campo é obrigatório.' })
    .email({
      message: 'Essa dado é inválido. Tente novamente.',
    }),
})

export type ForgotPasswordEmailInput = z.infer<typeof ForgotPasswordEmailSchema>

export const ResetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: 'Esse campo é obrigatório' })
      .min(6, { message: 'Mínimo de 6 caracteres' }),
    confirmPassword: z.string({ required_error: 'Esse campo é obrigatório' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
