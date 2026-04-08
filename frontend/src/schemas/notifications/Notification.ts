import { z } from 'zod'

export const NotificationTypeSchema = z.enum([
  'MEMBER_REGISTRATION',
  'FRANCHISOR_REQUEST',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'SYSTEM',
])

export type NotificationType = z.infer<typeof NotificationTypeSchema>

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: NotificationTypeSchema,
  link: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string().or(z.date()),
  readAt: z.string().or(z.date()).nullable(),
})

export type Notification = z.infer<typeof NotificationSchema>

export const NotificationsResponseSchema = z.object({
  data: z.array(NotificationSchema),
  total: z.number(),
  unread: z.number(),
  page: z.number(),
  lastPage: z.number(),
})

export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>

export const NotificationStatsSchema = z.object({
  total: z.number(),
  unread: z.number(),
  read: z.number(),
})

export type NotificationStats = z.infer<typeof NotificationStatsSchema>

export const MarkAsReadRequestSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
})

export type MarkAsReadRequest = z.infer<typeof MarkAsReadRequestSchema>
