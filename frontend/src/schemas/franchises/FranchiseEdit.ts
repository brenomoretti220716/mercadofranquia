import { z } from 'zod'

// Form schema without transforms (for react-hook-form)
export const FranchiseEditFormSchema = z
  .object({
    // Campos básicos
    name: z.string().min(1, 'Nome é obrigatório').optional(),

    // Investimentos
    minimumInvestment: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return /^\d+\.?\d*$/.test(val)
        },
        {
          message: 'Investimento deve conter apenas números',
        },
      ),
    maximumInvestment: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return /^\d+\.?\d*$/.test(val)
        },
        {
          message: 'Investimento deve conter apenas números',
        },
      ),

    // ROI (em meses)
    minimumReturnOnInvestment: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return /^\d+$/.test(val)
        },
        {
          message: 'ROI deve conter apenas números',
        },
      ),
    maximumReturnOnInvestment: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return /^\d+$/.test(val)
        },
        {
          message: 'ROI deve conter apenas números',
        },
      ),

    // Localização e unidades
    headquarterState: z.string().optional(),
    totalUnits: z.string().optional(),

    // Segmentos
    segment: z.string().optional(),
    subsegment: z.string().optional(),
    businessType: z.string().optional(),

    // Datas
    brandFoundationYear: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return /^\d+$/.test(val)
        },
        {
          message: 'Ano deve conter apenas números',
        },
      ),
    franchiseStartYear: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return /^\d+$/.test(val)
        },
        {
          message: 'Ano deve conter apenas números',
        },
      ),
    abfSince: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return /^\d+$/.test(val)
        },
        {
          message: 'Ano deve conter apenas números',
        },
      ),

    // Dados de contato
    phone: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          const digits = val.replace(/\D/g, '')
          return digits.length >= 10 && digits.length <= 11
        },
        {
          message: 'Telefone deve ter entre 10 e 11 dígitos',
        },
      ),
    email: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          return z.string().email().safeParse(val).success
        },
        {
          message: 'E-mail inválido',
        },
      ),
    website: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true
          try {
            const url = new URL(val)
            return url.protocol === 'http:' || url.protocol === 'https:'
          } catch {
            return false
          }
        },
        {
          message: 'URL inválida. Use http:// ou https://',
        },
      ),
  })
  .refine(
    (data) => {
      // Validate: maximum cannot exist without minimum
      if (
        data.maximumInvestment !== undefined &&
        data.minimumInvestment === undefined
      ) {
        return false
      }
      return true
    },
    {
      message: 'O investimento máximo requer um investimento mínimo',
      path: ['maximumInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate investment range: max > min when both provided
      if (
        data.minimumInvestment !== undefined &&
        data.maximumInvestment !== undefined
      ) {
        const min = parseFloat(String(data.minimumInvestment))
        const max = parseFloat(String(data.maximumInvestment))
        if (!isNaN(min) && !isNaN(max)) {
          return max > min
        }
      }
      return true
    },
    {
      message: 'Investimento máximo deve ser maior que o mínimo',
      path: ['maximumInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate: ROI maximum cannot exist without minimum
      if (
        data.maximumReturnOnInvestment !== undefined &&
        data.minimumReturnOnInvestment === undefined
      ) {
        return false
      }
      return true
    },
    {
      message: 'O ROI máximo requer um ROI mínimo',
      path: ['maximumReturnOnInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate ROI range: max > min when both provided
      if (
        data.minimumReturnOnInvestment !== undefined &&
        data.maximumReturnOnInvestment !== undefined
      ) {
        const min = parseInt(String(data.minimumReturnOnInvestment))
        const max = parseInt(String(data.maximumReturnOnInvestment))
        if (!isNaN(min) && !isNaN(max)) {
          return max > min
        }
      }
      return true
    },
    {
      message: 'ROI máximo deve ser maior que o mínimo',
      path: ['maximumReturnOnInvestment'],
    },
  )

// Schema with transforms for API submission
export const FranchiseEditSchema = z
  .object({
    // Campos básicos
    name: z.string().min(1, 'Nome é obrigatório').optional(),

    // Investimentos
    minimumInvestment: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => {
        if (!val || val === '') return undefined
        const parsed = parseFloat(val)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(z.number().positive().optional()),
    maximumInvestment: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => {
        if (!val || val === '') return undefined
        const parsed = parseFloat(val)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(z.number().positive().optional()),

    // ROI (em meses)
    minimumReturnOnInvestment: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => {
        if (!val || val === '') return undefined
        const parsed = parseInt(val)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(z.number().int().positive().optional()),
    maximumReturnOnInvestment: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => {
        if (!val || val === '') return undefined
        const parsed = parseInt(val)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(z.number().int().positive().optional()),

    // Localização e unidades
    headquarterState: z.string().optional().or(z.literal('')),
    totalUnits: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === '') return undefined
        const cleaned = val.replace(/\./g, '')
        const parsed = parseInt(cleaned)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(z.number().min(0).optional()),

    // Segmentos
    segment: z.string().optional().or(z.literal('')),
    subsegment: z.string().optional().or(z.literal('')),
    businessType: z.string().optional().or(z.literal('')),

    // Datas
    brandFoundationYear: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === '') return undefined
        const parsed = parseInt(val)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(
        z
          .number()
          .min(1800, 'Ano deve ser maior ou igual a 1800')
          .max(new Date().getFullYear(), 'Ano não pode ser no futuro')
          .optional(),
      ),
    franchiseStartYear: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === '') return undefined
        const parsed = parseInt(val)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(
        z
          .number()
          .min(1800, 'Ano deve ser maior ou igual a 1800')
          .max(new Date().getFullYear(), 'Ano não pode ser no futuro')
          .optional(),
      ),
    abfSince: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === '') return undefined
        const parsed = parseInt(val)
        return isNaN(parsed) ? undefined : parsed
      })
      .pipe(
        z
          .number()
          .min(1800, 'Ano deve ser maior ou igual a 1800')
          .max(new Date().getFullYear(), 'Ano não pode ser no futuro')
          .optional(),
      ),

    // Dados de contato
    phone: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true
          const digits = val.replace(/\D/g, '')
          return digits.length >= 10 && digits.length <= 11
        },
        {
          message: 'Telefone deve ter entre 10 e 11 dígitos',
        },
      ),
    email: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true
          return z.string().email().safeParse(val).success
        },
        {
          message: 'E-mail inválido',
        },
      )
      .transform((val) => (val === '' ? undefined : val)),
    website: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true
          try {
            const url = new URL(val)
            return url.protocol === 'http:' || url.protocol === 'https:'
          } catch {
            return false
          }
        },
        {
          message: 'URL inválida. Use http:// ou https://',
        },
      )
      .transform((val) => (val === '' ? undefined : val)),
  })
  .refine(
    (data) => {
      // Validate: maximum cannot exist without minimum
      if (
        data.maximumInvestment !== undefined &&
        data.minimumInvestment === undefined
      ) {
        return false
      }
      return true
    },
    {
      message: 'O investimento máximo requer um investimento mínimo',
      path: ['maximumInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate investment range: max > min when both provided
      if (
        data.minimumInvestment !== undefined &&
        data.maximumInvestment !== undefined
      ) {
        const min = parseFloat(String(data.minimumInvestment))
        const max = parseFloat(String(data.maximumInvestment))
        if (!isNaN(min) && !isNaN(max)) {
          return max > min
        }
      }
      return true
    },
    {
      message: 'Investimento máximo deve ser maior que o mínimo',
      path: ['maximumInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate: ROI maximum cannot exist without minimum
      if (
        data.maximumReturnOnInvestment !== undefined &&
        data.minimumReturnOnInvestment === undefined
      ) {
        return false
      }
      return true
    },
    {
      message: 'O ROI máximo requer um ROI mínimo',
      path: ['maximumReturnOnInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate ROI range: max > min when both provided
      if (
        data.minimumReturnOnInvestment !== undefined &&
        data.maximumReturnOnInvestment !== undefined
      ) {
        const min = parseInt(String(data.minimumReturnOnInvestment))
        const max = parseInt(String(data.maximumReturnOnInvestment))
        if (!isNaN(min) && !isNaN(max)) {
          return max > min
        }
      }
      return true
    },
    {
      message: 'ROI máximo deve ser maior que o mínimo',
      path: ['maximumReturnOnInvestment'],
    },
  )

// Type for form input (no transforms)
export type FranchiseEditFormInput = z.infer<typeof FranchiseEditFormSchema>

// Type for API submission (with transforms)
export type FranchiseEditInput = z.output<typeof FranchiseEditSchema>
