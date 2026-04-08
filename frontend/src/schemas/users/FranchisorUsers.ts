import { isValidCPF } from '@/src/utils/formaters'
import { z } from 'zod'

// Função para validar CNPJ
const isValidCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '')

  if (cleanCNPJ.length !== 14 || /^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false

  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  return digit2 === parseInt(cleanCNPJ.charAt(13))
}

export const FranchisorUserRegisterSchema = z
  .object({
    name: z.string().min(1, 'Esse campo é obrigatório'),
    email: z
      .string({ required_error: 'Esse campo é obrigatório' })
      .min(1, { message: 'Esse campo é obrigatório' })
      .email({
        message: 'Essa dado é inválido. Tente novamente.',
      }),
    cpfCnpj: z
      .string()
      .min(1, 'Esse campo é obrigatório')
      .refine(
        (value) => {
          const clean = value.replace(/\D/g, '')
          return clean.length === 11 || clean.length === 14
        },
        {
          message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
        },
      )
      .refine(
        (value) => {
          const clean = value.replace(/\D/g, '')
          if (clean.length === 11) {
            return isValidCPF(clean)
          } else if (clean.length === 14) {
            return isValidCNPJ(clean)
          }
          return false
        },
        {
          message: 'CPF ou CNPJ inválido',
        },
      ),
    ownedFranchises: z.array(z.string()).min(1, 'Esse campo é obrigatório'),
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

export const FranchisorUserEditingSchema = z
  .object({
    name: z.string().min(1, 'Esse campo é obrigatório'),
    email: z
      .string({ required_error: 'Esse campo é obrigatório' })
      .min(1, { message: 'Esse campo é obrigatório' })
      .email({
        message: 'Essa dado é inválido. Tente novamente.',
      }),
    cpfCnpj: z.string().min(1, 'Esse campo é obrigatório'),
    ownedFranchises: z.array(z.string()).min(1, 'Esse campo é obrigatório'),
    isActive: z.boolean({
      required_error: 'Status obrigatório',
    }),
    password: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          return val.length >= 6
        },
        { message: 'Mínimo de 6 caracteres' },
      )
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          return /[A-Z]/.test(val)
        },
        { message: 'Pelo menos uma letra maiúscula' },
      )
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          return /[0-9]/.test(val)
        },
        { message: 'Pelo menos um número' },
      ),
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
      message: 'As senhas não coincidem.',
      path: ['confirmPassword'],
    },
  )

export type FranchisorUserRegisterInput = z.infer<
  typeof FranchisorUserRegisterSchema
>
export type FranchisorUserEditingInput = z.infer<
  typeof FranchisorUserEditingSchema
>
