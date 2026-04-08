import { z } from 'zod';
import { validateCNPJ } from '../common/utils/validateCnpj';

export const stepThreeSchema = z.object({
  streamName: z.string().min(1, 'This field is required'),
  cnpj: z
    .string()
    .min(1, 'This field is required')
    .refine(validateCNPJ, 'Invalid CNPJ'),
  responsable: z.string().min(1, 'This field is required'),
  responsableRole: z.string().min(1, 'This field is required'),
  commercialEmail: z
    .string()
    .email('Invalid email format')
    .min(1, 'This field is required'),
  commercialPhone: z
    .string()
    .min(1, 'Commercial phone is required')
    .min(10, 'Commercial phone must have at least 10 digits')
    .max(11, 'Commercial phone can have at most 11 digits'),
});

export const approveRequestSchema = z.object({
  ownedFranchises: z
    .array(z.string().cuid('Franchise ID must be a valid cuid'))
    .min(1, 'At least one franchise is required'),
});

export const rejectRequestSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters'),
});

export const updateRequestSchema = stepThreeSchema.partial();

export type StepThreeDto = z.infer<typeof stepThreeSchema>;
export type ApproveRequestDto = z.infer<typeof approveRequestSchema>;
export type RejectRequestDto = z.infer<typeof rejectRequestSchema>;
export type UpdateRequestDto = z.infer<typeof updateRequestSchema>;
