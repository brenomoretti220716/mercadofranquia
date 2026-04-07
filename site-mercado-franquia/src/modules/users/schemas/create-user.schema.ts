import { Role } from '@prisma/client';
import { z } from 'zod';
import { validateCNPJ } from '../common/utils/validateCnpj';
import { validateCPF } from '../common/utils/validateCpf';

export const stepOneSchema = z.object({
  name: z.string().min(1, 'This field is required'),
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required'),
  password: z
    .string()
    .min(6, 'Password must have at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .min(10, 'Phone must have at least 10 digits')
    .max(11, 'Phone can have at most 11 digits'),
});

export const resendVerificationCodeSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required'),
});

export const stepTwoSchema = z
  .object({
    role: z.enum(['FRANCHISEE', 'CANDIDATE', 'ENTHUSIAST', 'FRANCHISOR'], {
      errorMap: () => ({ message: 'Invalid role' }),
    }),
    city: z.string().min(1, 'This field is required'),
    interestSectors: z.string().min(1, 'This field is required'),
    interestRegion: z.string().min(1, 'This field is required'),
    investmentRange: z.string().min(1, 'This field is required'),
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

export const createAdminUserSchema = z.object({
  name: z.string().min(1, 'This field is required'),
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required'),
  password: z
    .string()
    .min(6, 'Password must have at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .min(10, 'Phone must have at least 10 digits')
    .max(11, 'Phone can have at most 11 digits'),
  cpf: z
    .string()
    .min(1, 'CPF is required')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 11;
    }, 'CPF must have exactly 11 digits')
    .refine(validateCPF, 'Invalid CPF'),
});

export const adminUserSchema = z.object({
  name: z.string().min(1, 'This field is required'),
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required'),
  password: z
    .string()
    .min(6, 'Password must have at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .min(10, 'Phone must have at least 10 digits')
    .max(11, 'Phone can have at most 11 digits'),
  cpf: z
    .string()
    .min(1, 'CPF is required')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 11;
    }, 'CPF must have exactly 11 digits')
    .refine(validateCPF, 'Invalid CPF'),
  role: z.literal(Role.ADMIN),
});

export const franchisorUserSchema = z.object({
  name: z.string().min(1, 'This field is required'),
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required'),
  password: z
    .string()
    .min(6, 'Password must have at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .min(10, 'Phone must have at least 10 digits')
    .max(11, 'Phone can have at most 11 digits'),
  cpf: z
    .string()
    .min(1, 'CPF is required')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 11;
    }, 'CPF must have exactly 11 digits')
    .refine(validateCPF, 'Invalid CPF'),
  cnpj: z
    .string()
    .min(1, 'This field is required')
    .refine(validateCNPJ, 'Invalid CNPJ'),
  ownedFranchises: z
    .array(z.string().cuid('Franchise ID must be a valid cuid'))
    .min(1, 'At least one franchise is required'),
  isActive: z.boolean().default(true),
});

export const franchiseesUserSchema = z.object({
  name: z.string().min(1, 'This field is required'),
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required'),
  password: z
    .string()
    .min(6, 'Password must have at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .min(10, 'Phone must have at least 10 digits')
    .max(11, 'Phone can have at most 11 digits'),
  cpf: z
    .string()
    .min(1, 'CPF is required')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 11;
    }, 'CPF must have exactly 11 digits')
    .refine(validateCPF, 'Invalid CPF'),
  role: z.enum(['FRANCHISEE', 'CANDIDATE', 'ENTHUSIAST']),
  city: z.string().min(1, 'City is required'),
  franchiseeOf: z
    .array(z.string().cuid('Franchise ID must be a valid cuid'))
    .min(1, 'At least one franchise is required')
    .optional(),
});

export type StepOneDto = z.infer<typeof stepOneSchema>;
export type ResendVerificationCodeDto = z.infer<
  typeof resendVerificationCodeSchema
>;
export type StepTwoDto = z.infer<typeof stepTwoSchema>;
export type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;
export type AdminUserDto = z.infer<typeof adminUserSchema>;
export type FranchisorUserDto = z.infer<typeof franchisorUserSchema>;
export type FranchiseesUserDTO = z.infer<typeof franchiseesUserSchema>;
