import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export interface NotificationResponseDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date | null;
}

export interface NotificationStatsDto {
  total: number;
  unread: number;
  read: number;
}
