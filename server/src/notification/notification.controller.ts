import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  Delete,
  Post,
  Body,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RequestWithUser } from 'src/shared/types/request.types';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';
import { TestNotificationDto } from './dto/test-notification.dto';
import { CreateNotificationDto } from './dto/cerate-notification.dto';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { Public } from 'src/auth/decorators/public.decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Roles(Role.ADMIN, Role.PATIENT, Role.PHARMACIST, Role.DOCTOR)
  @Post('push/test')
  @ApiOperation({
    summary: 'Send a test push notification to the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test notification sent successfully',
  })
  @ApiBody({ type: TestNotificationDto })
  async testNotification(
    @Body() dto: TestNotificationDto,
    @Req() req: RequestWithUser,
  ) {
    await this.notificationService.triggerTestNotification(req.user.sub, dto);
    return { success: true, message: 'Test notification sent' };
  }

  @Public()
  @Post('push/subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscribed successfully',
  })
  @ApiBody({ type: PushSubscriptionDto })
  async subscribeToPush(@Body() dto: PushSubscriptionDto) {
    return this.notificationService.subscribeToPush({
      ...dto,
      userId: dto.userId,
    });
  }

  @Public()
  @Post('push/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unsubscribed successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        endpoint: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  })
  async unsubscribeFromPush(
    @Body() { endpoint, userId }: { endpoint: string; userId: string },
  ) {
    return this.notificationService.unsubscribeFromPush(userId, endpoint);
  }

  @Roles(Role.ADMIN, Role.PATIENT, Role.PHARMACIST, Role.DOCTOR)
  @Post('whatsapp')
  @ApiOperation({ summary: 'Send a WhatsApp notification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'WhatsApp notification sent',
  })
  @ApiBody({ type: CreateNotificationDto })
  async sendWhatsApp(
    @Body() dto: CreateNotificationDto,
    @Req() req: RequestWithUser,
  ) {
    if (!dto.userPhone) throw new BadRequestException('Phone number required');
    return this.notificationService.sendWhatsAppNotification(
      req.user.sub,
      dto.userPhone,
      dto,
    );
  }

  @Roles(Role.ADMIN, Role.PATIENT, Role.PHARMACIST, Role.DOCTOR)
  @Post('bulk')
  @ApiOperation({ summary: 'Send bulk notifications via Pusher' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk notifications sent',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' },
        title: { type: 'string' },
        url: { type: 'string' },
      },
    },
  })
  async sendBulkNotifications(
    @Body() { userIds, ...dto }: { userIds: string[] } & CreateNotificationDto,
  ) {
    return this.notificationService.triggerPusherEvents(userIds, dto);
  }

  @Roles(Role.ADMIN, Role.PATIENT, Role.PHARMACIST, Role.DOCTOR)
  @Get()
  @ApiOperation({ summary: 'Get current user notifications with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of notifications' })
  async getUserNotifications(
    @Req() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.sub,
      page,
      limit,
    );
  }

  @Roles(Role.ADMIN, Role.PATIENT, Role.PHARMACIST, Role.DOCTOR)
  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Req() req: RequestWithUser) {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Roles(Role.ADMIN, Role.PATIENT, Role.PHARMACIST, Role.DOCTOR)
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
  })
  async markAsRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.notificationService.markAsRead(id, req.user.sub);
  }

  @Roles(Role.ADMIN, Role.PATIENT, Role.PHARMACIST, Role.DOCTOR)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification deleted' })
  async deleteNotification(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.notificationService.deleteNotification(id, req.user.sub);
  }
}
