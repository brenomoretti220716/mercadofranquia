import z from 'zod';

/**
 * Parse percentage string to decimal
 */

export const baseUpdateFranchiseSchema = z
  .object({
    // Campos básicos
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    detailedDescription: z.string().optional(),

    // Investment Range (accept string or number, convert to number)
    minimumInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),
    maximumInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),

    // Capital fields (accept string or number, convert to number)
    setupCapital: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),
    workingCapital: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),

    // Store area (accept string or number, convert to integer)
    storeArea: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseInt(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().int().positive().optional())
      .optional(),
    totalUnits: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const cleaned = val.replace(/\./g, '');
          const parsed = parseInt(cleaned);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(0),
      ])
      .optional(),
    totalUnitsInBrazil: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const cleaned = val.replace(/\./g, '');
          const parsed = parseInt(cleaned);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(0),
      ])
      .optional(),

    // Fundação e datas (opcionais)
    brandFoundationYear: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const parsed = parseInt(val);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(1800).max(new Date().getFullYear()),
      ])
      .optional(),
    franchiseStartYear: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const parsed = parseInt(val);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(1800).max(new Date().getFullYear()),
      ])
      .optional(),
    abfSince: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const parsed = parseInt(val);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(1800).max(new Date().getFullYear()),
      ])
      .optional(),

    // Outros campos booleanos e strings
    isAbfAssociated: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          return val.toLowerCase() === 'true' || val === '1';
        }),
        z.boolean(),
      ])
      .optional(),

    // Localização
    headquarterState: z.string().optional().or(z.literal('')),
    headquarter: z.string().optional().or(z.literal('')),

    // ROI Range (accept string or number, convert to integer months)
    minimumReturnOnInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseInt(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().int().positive().optional())
      .optional(),
    maximumReturnOnInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseInt(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().int().positive().optional())
      .optional(),

    // Revenue and fees (accept string or number, convert to number)
    averageMonthlyRevenue: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),
    franchiseFee: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),

    // Percentages (accept string or number, convert to number, 0-100)
    royalties: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().min(0).max(100).optional())
      .optional(),
    advertisingFee: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().min(0).max(100).optional())
      .optional(),

    // Calculation bases (keep as strings for flexibility)
    calculationBaseRoyaltie: z.string().optional().or(z.literal('')),
    calculationBaseAdFee: z.string().optional().or(z.literal('')),

    // Mídia
    logoUrl: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        {
          message: 'Invalid URL format. Use http:// or https://',
        },
      ),
    thumbnailUrl: z.string().optional().or(z.literal('')),
    galleryUrls: z.string().optional().or(z.literal('')),
    videoUrl: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;

          // Check if it's a JSON array string
          if (val.trim().startsWith('[')) {
            try {
              const parsed: unknown = JSON.parse(val);
              if (Array.isArray(parsed)) {
                // Validate each URL in the array
                return parsed.every((url: unknown) => {
                  if (typeof url !== 'string') return false;
                  try {
                    const urlObj = new URL(url);
                    return (
                      urlObj.protocol === 'http:' ||
                      urlObj.protocol === 'https:'
                    );
                  } catch {
                    return false;
                  }
                });
              }
            } catch {
              return false;
            }
          }

          // Validate as single URL (backward compatibility)
          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        {
          message: 'Invalid URL format. Use http:// or https://',
        },
      ),

    // Outros
    businessType: z.string().optional().or(z.literal('')),
    segment: z.string().optional().or(z.literal('')),
    subsegment: z.string().optional().or(z.literal('')),

    // Dados de contato (opcionais)
    phone: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return val.length >= 10 && val.length <= 11;
        },
        {
          message: 'Phone must have between 10 and 11 digits',
        },
      ),
    email: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return z.string().email().safeParse(val).success;
        },
        {
          message: 'Invalid email format',
        },
      ),
    website: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        {
          message: 'Invalid URL format. Use http:// or https://',
        },
      ),

    // Status
    isActive: z.boolean().optional(),

    // Ranking
    rankingPosition: z.number().optional().or(z.literal('')),

    // Data de último scraping
    lastScrapedAt: z
      .date()
      .optional()
      .or(
        z
          .string()
          .datetime()
          .transform((val) => new Date(val))
          .optional(),
      ),
    scrapedWebsite: z.string().url().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Validate: maximum investment should be >= minimum investment
      if (data.minimumInvestment && data.maximumInvestment) {
        return data.maximumInvestment >= data.minimumInvestment;
      }
      return true;
    },
    {
      message:
        'Maximum investment must be greater than or equal to minimum investment',
      path: ['maximumInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate: maximum ROI should be >= minimum ROI
      if (data.minimumReturnOnInvestment && data.maximumReturnOnInvestment) {
        return data.maximumReturnOnInvestment >= data.minimumReturnOnInvestment;
      }
      return true;
    },
    {
      message:
        'Maximum return on investment must be greater than or equal to minimum',
      path: ['maximumReturnOnInvestment'],
    },
  );

export const FranchisorUpdateSchema = z
  .object({
    // Campos básicos
    name: z.string().min(1, 'Name is required').optional(),
    detailedDescription: z.string().optional(),

    // Investment Range (accept string or number, convert to number)
    minimumInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),
    maximumInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().positive().optional())
      .optional(),

    // Área e unidades
    totalUnits: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const cleaned = val.replace(/\./g, '');
          const parsed = parseInt(cleaned);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(0),
      ])
      .optional(),

    // Fundação e datas (opcionais)
    brandFoundationYear: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const parsed = parseInt(val);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(1800).max(new Date().getFullYear()),
      ])
      .optional(),
    franchiseStartYear: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const parsed = parseInt(val);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(1800).max(new Date().getFullYear()),
      ])
      .optional(),
    abfSince: z
      .union([
        z.string().transform((val) => {
          if (!val || val === '') return undefined;
          const parsed = parseInt(val);
          return isNaN(parsed) ? undefined : parsed;
        }),
        z.number().min(1800).max(new Date().getFullYear()),
      ])
      .optional(),

    // ROI Range (accept string or number, convert to integer months)
    minimumReturnOnInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseInt(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().int().positive().optional())
      .optional(),
    maximumReturnOnInvestment: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'number') return val;
        const parsed = parseInt(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number().int().positive().optional())
      .optional(),

    // Localização
    headquarterState: z.string().optional().or(z.literal('')),

    // Outros
    businessType: z.string().optional().or(z.literal('')),
    segment: z.string().optional().or(z.literal('')),
    subsegment: z.string().optional().or(z.literal('')),

    // Mídia
    videoUrl: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;

          // Check if it's a JSON array string
          if (val.trim().startsWith('[')) {
            try {
              const parsed: unknown = JSON.parse(val);
              if (Array.isArray(parsed)) {
                // Validate each URL in the array
                return parsed.every((url: unknown) => {
                  if (typeof url !== 'string') return false;
                  try {
                    const urlObj = new URL(url);
                    return (
                      urlObj.protocol === 'http:' ||
                      urlObj.protocol === 'https:'
                    );
                  } catch {
                    return false;
                  }
                });
              }
            } catch {
              return false;
            }
          }

          // Validate as single URL (backward compatibility)
          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        {
          message: 'Invalid URL format. Use http:// or https://',
        },
      ),

    // Dados de contato (opcionais)
    phone: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return val.length >= 10 && val.length <= 11;
        },
        {
          message: 'Phone must have between 10 and 11 digits',
        },
      ),
    email: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return z.string().email().safeParse(val).success;
        },
        {
          message: 'Invalid email format',
        },
      ),
    website: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        {
          message: 'Invalid URL format. Use http:// or https://',
        },
      ),
  })
  .passthrough() // Allow unknown fields (like file fields that multer might add)
  .refine(
    (data) => {
      // Validate: maximum investment should be > minimum investment (not equal)
      // Only validate if both are provided in the same request
      // Note: minimum may already exist in DB, so we only validate when both are sent together
      if (
        data.minimumInvestment !== undefined &&
        data.maximumInvestment !== undefined
      ) {
        return data.maximumInvestment > data.minimumInvestment;
      }
      return true;
    },
    {
      message: 'Maximum investment must be greater than minimum investment',
      path: ['maximumInvestment'],
    },
  )
  .refine(
    (data) => {
      // Validate: maximum ROI should be > minimum ROI (not equal)
      // Only validate if both are provided in the same request
      // Note: minimum may already exist in DB, so we only validate when both are sent together
      if (
        data.minimumReturnOnInvestment !== undefined &&
        data.maximumReturnOnInvestment !== undefined
      ) {
        return data.maximumReturnOnInvestment > data.minimumReturnOnInvestment;
      }
      return true;
    },
    {
      message: 'Maximum ROI must be greater than minimum ROI',
      path: ['maximumReturnOnInvestment'],
    },
  );

export type FranchisorUpdateFranchiseType = z.infer<
  typeof FranchisorUpdateSchema
>;
export type UpdateFranchiseType = z.infer<typeof baseUpdateFranchiseSchema>;

export interface FranchisorUpdateWithFileDto {
  name?: string;
  minimumInvestment?: number;
  maximumInvestment?: number;
  minimumReturnOnInvestment?: number;
  maximumReturnOnInvestment?: number;
  headquarterState?: string;
  totalUnits?: number;
  segment?: string;
  subsegment?: string;
  businessType?: string;
  brandFoundationYear?: number;
  franchiseStartYear?: number;
  abfSince?: number;
  videoUrl?: string;
  detailedDescription?: string;
  phone?: string;
  email?: string;
  website?: string;
  photo?: Express.Multer.File;
}
