import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string().cuid('Invalid notification ID')),
});

export const markAllAsReadSchema = z.object({});

export type GetNotificationsQueryDto = z.infer<
  typeof getNotificationsQuerySchema
>;
export type MarkAsReadDto = z.infer<typeof markAsReadSchema>;
export type MarkAllAsReadDto = z.infer<typeof markAllAsReadSchema>;
