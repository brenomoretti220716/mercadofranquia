import { z } from 'zod'
import { isValidCNPJ, stripNonDigits } from '@/src/utils/formaters'

const fileInstanceSchema = z
  .custom<File | null>(
    (value) => {
      if (value === null) {
        return true
      }

      if (typeof File === 'undefined') {
        return true
      }

      return value instanceof File
    },
    {
      message: 'Documento inválido',
    },
  )
  .nullable()

export enum FranchisorRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export interface FranchisorRequest {
  id: string
  userId: string
  streamName: string
  cnpj: string
  responsable: string
  responsableRole: string
  commercialEmail: string
  commercialPhone: string
  cnpjCardPath: string
  socialContractPath: string
  status: FranchisorRequestStatus
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
    phone: string
    cpf: string
  }
}

export interface CreateFranchisorRequestDto {
  streamName: string
  cnpj: string
  responsable: string
  responsableRole: string
  commercialEmail: string
  commercialPhone: string
  cnpjCard: File
  socialContract: File
}

export interface UpdateFranchisorRequestDto {
  streamName?: string
  cnpj?: string
  responsable?: string
  responsableRole?: string
  commercialEmail?: string
  commercialPhone?: string
  cnpjCard?: File
  socialContract?: File
}

export interface ApproveFranchisorRequestDto {
  ownedFranchises: string[]
}

export interface RejectFranchisorRequestDto {
  rejectionReason: string
}

// Zod schema for franchisor request form
export const FranchisorRequestFormSchema = z
  .object({
    streamName: z
      .string()
      .min(1, 'Nome da marca é obrigatório')
      .min(3, 'Nome da marca deve ter pelo menos 3 caracteres'),
    cnpj: z
      .string()
      .min(1, 'CNPJ é obrigatório')
      .refine((val) => isValidCNPJ(val), {
        message: 'CNPJ inválido',
      }),
    responsable: z
      .string()
      .min(1, 'Nome do responsável é obrigatório')
      .min(3, 'Nome do responsável deve ter pelo menos 3 caracteres'),
    responsableRole: z.string().min(1, 'Cargo do responsável é obrigatório'),
    commercialEmail: z
      .string()
      .min(1, 'Email comercial é obrigatório')
      .email('Email inválido'),
    commercialPhone: z
      .string()
      .min(1, 'Telefone comercial é obrigatório')
      .refine(
        (val) => {
          const digits = stripNonDigits(val)
          return digits.length === 10 || digits.length === 11 // 10 or 11 digits for Brazilian phone
        },
        { message: 'Telefone deve ter 10 ou 11 dígitos' },
      ),
    cnpjCard: fileInstanceSchema,
    socialContract: fileInstanceSchema,
  })
  .refine(
    () => {
      // Files are required only when creating (will be checked in component)
      return true
    },
    {
      message: 'Documentos são obrigatórios',
    },
  )

export type FranchisorRequestFormInput = z.infer<
  typeof FranchisorRequestFormSchema
>
