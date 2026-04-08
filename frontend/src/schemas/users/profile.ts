import { isValidCPF, stripNonDigits } from '@/src/utils/formaters'
import { z } from 'zod'

// ============================================================================
// REGULAR USER - UPDATE BASIC INFO
// ============================================================================

export const UpdateBasicInfoSchema = z.object({
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
  cpf: z
    .string()
    .optional()
    .refine((val) => (val ? isValidCPF(val) : true), {
      message: 'CPF inválido',
    }),
})

export type UpdateBasicInfoInput = z.infer<typeof UpdateBasicInfoSchema>

// ============================================================================
// REGULAR USER - UPDATE PROFILE
// ============================================================================

export const UpdateProfileSchema = z
  .object({
    city: z.string().min(1, 'Cidade é obrigatória').optional(),
    interestSectors: z
      .string()
      .min(1, 'Setores de interesse são obrigatórios')
      .optional(),
    interestRegion: z
      .string()
      .min(1, 'Região de interesse é obrigatória')
      .optional(),
    investmentRange: z
      .string()
      .min(1, 'Faixa de investimento é obrigatória')
      .optional(),
    role: z
      .enum(['FRANCHISEE', 'CANDIDATE', 'ENTHUSIAST', 'FRANCHISOR'])
      .optional(),
    franchiseeOf: z.array(z.string().cuid('Invalid franchise ID')).optional(),
  })
  .refine(
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

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

// ============================================================================
// ADMIN - UPDATE USER BASIC INFO
// ============================================================================

export const AdminUpdateBasicInfoSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true // Optional field
          const digits = stripNonDigits(val)
          return digits.length === 10 || digits.length === 11 // 10 or 11 digits for Brazilian phone
        },
        { message: 'Telefone deve ter 10 ou 11 dígitos' },
      ),
    password: z
      .string()
      .min(6, 'Mínimo de 6 caracteres')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.trim() !== '') {
        return data.password === data.confirmPassword
      }
      return true
    },
    {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    },
  )

export type AdminUpdateBasicInfoInput = z.infer<
  typeof AdminUpdateBasicInfoSchema
>

// ============================================================================
// ADMIN - UPDATE USER PROFILE
// ============================================================================

export const AdminUpdateProfileSchema = z
  .object({
    city: z.string().min(1, 'Cidade é obrigatória').optional(),
    interestSectors: z.string().min(1, 'Setor é obrigatório').optional(),
    interestRegion: z.string().min(1, 'Região é obrigatória').optional(),
    investmentRange: z
      .string()
      .min(1, 'Faixa de investimento é obrigatória')
      .optional(),
    role: z
      .enum(['FRANCHISEE', 'CANDIDATE', 'ENTHUSIAST', 'FRANCHISOR'])
      .optional(),
    franchiseeOf: z.array(z.string()).optional(),
  })
  .refine(
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

export type AdminUpdateProfileInput = z.infer<typeof AdminUpdateProfileSchema>

// ============================================================================
// EMAIL CHANGE SCHEMAS
// ============================================================================

export const RequestEmailChangeSchema = z.object({
  newEmail: z
    .string({ required_error: 'Esse campo é obrigatório' })
    .min(1, { message: 'Esse campo é obrigatório' })
    .email({
      message: 'Email inválido. Tente novamente.',
    }),
})

export const VerifyEmailChangeSchema = z.object({
  newEmail: z
    .string({ required_error: 'Esse campo é obrigatório' })
    .min(1, { message: 'Esse campo é obrigatório' })
    .email({
      message: 'Email inválido. Tente novamente.',
    }),
  code: z
    .string({ required_error: 'Esse campo é obrigatório' })
    .min(6, { message: 'Código deve ter 6 dígitos' })
    .max(6, { message: 'Código deve ter 6 dígitos' }),
})

export type RequestEmailChangeInput = z.infer<typeof RequestEmailChangeSchema>
export type VerifyEmailChangeInput = z.infer<typeof VerifyEmailChangeSchema>

// ============================================================================
// PASSWORD UPDATE SCHEMAS
// ============================================================================

export const UpdatePasswordSchema = z
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

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>
