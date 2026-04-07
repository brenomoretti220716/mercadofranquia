import { z } from 'zod';
import { validateCPF } from '../common/utils/validateCpf';

const baseUpdateUserSchema = z.object({
  name: z.string().min(1, 'This field is required').optional(),
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required')
    .optional(),
  password: z
    .string()
    .min(6, 'Password must have at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .min(10, 'Phone must have at least 10 digits')
    .max(11, 'Phone can have at most 11 digits')
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateAdminUserSchema = baseUpdateUserSchema;

export const updateFranchisorUserSchema = baseUpdateUserSchema
  .extend({
    ownedFranchises: z
      .array(z.string().cuid('Franchise ID must be a valid cuid'))
      .min(1, 'At least one franchise is required')
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if ('cpf' in data) {
        return false;
      }
      return true;
    },
    {
      message: 'CPF cannot be edited for franchisors',
      path: ['cpf'],
    },
  )
  .refine(
    (data) => {
      if ('cnpj' in data) {
        return false;
      }
      return true;
    },
    {
      message: 'CNPJ cannot be edited for franchisors',
      path: ['cnpj'],
    },
  );

export const updateUserBasicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .min(10, 'Phone must have at least 10 digits')
    .max(11, 'Phone can have at most 11 digits')
    .optional(),
  cpf: z
    .string()
    .min(1, 'CPF is required')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 11;
    }, 'CPF must have exactly 11 digits')
    .refine(validateCPF, 'Invalid CPF')
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateUserProfileSchema = z
  .object({
    city: z.string().min(1, 'This field is required').optional(),
    interestSectors: z.string().min(1, 'This field is required').optional(),
    interestRegion: z.string().min(1, 'This field is required').optional(),
    investmentRange: z.string().min(1, 'This field is required').optional(),
    role: z
      .enum(['FRANCHISEE', 'CANDIDATE', 'ENTHUSIAST', 'FRANCHISOR'])
      .optional(),
    franchiseeOf: z.array(z.string().cuid('Invalid franchise ID')).optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'FRANCHISEE') {
        return data.franchiseeOf && data.franchiseeOf.length > 0;
      }
      return true;
    },
    {
      message: 'FRANCHISEE role requires at least one franchise to be linked',
      path: ['franchiseeOf'],
    },
  );

// Email change schemas
export const requestEmailChangeSchema = z.object({
  newEmail: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
});

export const verifyEmailChangeSchema = z.object({
  newEmail: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits'),
});

// Password update schema
export const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must have at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UpdateAdminUserDto = z.infer<typeof updateAdminUserSchema>;
export type UpdateFranchisorUserDto = z.infer<
  typeof updateFranchisorUserSchema
>;
export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserBasicInfoDto = z.infer<typeof updateUserBasicInfoSchema>;
export type RequestEmailChangeDto = z.infer<typeof requestEmailChangeSchema>;
export type VerifyEmailChangeDto = z.infer<typeof verifyEmailChangeSchema>;
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;
