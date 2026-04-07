import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationStatsDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
      },
    });

    return notification;
  }

  async createMany(
    notifications: CreateNotificationDto[],
  ): Promise<{ count: number }> {
    const data = notifications.map((notif) => ({
      userId: notif.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      link: notif.link,
    }));

    const result = await this.prisma.notification.createMany({
      data,
    });

    return { count: result.count };
  }

  async findAllByUser(
    userId: string,
    page = 1,
    limit = 10,
    unreadOnly = false,
  ): Promise<{
    data: NotificationResponseDto[];
    total: number;
    unread: number;
    page: number;
    lastPage: number;
  }> {
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data,
      total,
      unread,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async markAsRead(
    userId: string,
    notificationIds: string[],
  ): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async getStats(userId: string): Promise<NotificationStatsDto> {
    const [total, unread] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      total,
      unread,
      read: total - unread,
    };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  // Helper methods for creating specific notification types
  async notifyMemberRegistration(
    adminUserIds: string[],
    memberName: string,
  ): Promise<void> {
    const notifications: CreateNotificationDto[] = adminUserIds.map(
      (adminId) => ({
        userId: adminId,
        title: 'Novo membro registrado',
        message: `${memberName} se registrou e precisa completar seu perfil.`,
        type: NotificationType.MEMBER_REGISTRATION,
        link: '/perfil',
      }),
    );

    await this.createMany(notifications);
  }

  async notifyFranchisorRequest(
    adminUserIds: string[],
    franchisorName: string,
  ): Promise<void> {
    const notifications: CreateNotificationDto[] = adminUserIds.map(
      (adminId) => ({
        userId: adminId,
        title: 'Nova solicitação de franqueador',
        message: `${franchisorName} enviou uma solicitação de franqueador para revisão.`,
        type: NotificationType.FRANCHISOR_REQUEST,
        link: '/admin/franqueadores',
      }),
    );

    await this.createMany(notifications);
  }

  async notifyRequestApproved(userId: string, userName: string): Promise<void> {
    await this.create({
      userId,
      title: 'Solicitação aprovada',
      message: `Parabéns ${userName}! Sua solicitação de franqueador foi aprovada.`,
      type: NotificationType.REQUEST_APPROVED,
      link: '/perfil',
    });
  }

  async notifyRequestRejected(
    userId: string,
    userName: string,
    reason?: string,
  ): Promise<void> {
    const message = reason
      ? `${userName}, sua solicitação de franqueador foi rejeitada. Motivo: ${reason}`
      : `${userName}, sua solicitação de franqueador foi rejeitada. Por favor, contate o suporte para mais informações.`;

    await this.create({
      userId,
      title: 'Solicitação rejeitada',
      message,
      type: NotificationType.REQUEST_REJECTED,
      link: '/perfil',
    });
  }
}
