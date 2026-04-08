import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { JwtPayload } from '../auth/jwt.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';
import {
  GetNotificationsQueryDto,
  getNotificationsQuerySchema,
  MarkAsReadDto,
  markAsReadSchema,
} from './schemas/notification.schema';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getMyNotifications(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(getNotificationsQuerySchema))
    query: GetNotificationsQueryDto,
  ) {
    return this.notificationsService.findAllByUser(
      user.id,
      query.page,
      query.limit,
      query.unreadOnly,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics for current user' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getMyNotificationStats(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getStats(user.id);
  }

  @Patch('mark-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(markAsReadSchema)) data: MarkAsReadDto,
  ) {
    return this.notificationsService.markAsRead(user.id, data.notificationIds);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteNotification(user.id, id);
  }
}
