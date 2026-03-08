import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as Pusher from 'pusher';
import * as webpush from 'web-push';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import * as twilio from 'twilio';
import { TestNotificationDto } from './dto/test-notification.dto';
import { CreateNotificationDto } from './dto/cerate-notification.dto';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private pusher: Pusher | null = null;
  private twilioClient: twilio.Twilio | null = null;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
    private configService: ConfigService,
  ) {
    // Initialize Pusher (optional)
    const pusherAppId = this.configService.get('PUSHER_APP_ID');
    const pusherKey = this.configService.get('PUSHER_KEY');
    const pusherSecret = this.configService.get('PUSHER_SECRET');
    const pusherCluster = this.configService.get('PUSHER_CLUSTER');

    if (pusherAppId && pusherKey && pusherSecret && pusherCluster) {
      this.pusher = new Pusher({
        appId: pusherAppId,
        key: pusherKey,
        secret: pusherSecret,
        cluster: pusherCluster,
        useTLS: true,
      });
    } else {
      this.logger.warn(
        'Pusher is not configured. Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER to enable.',
      );
    }

    // Initialize Twilio (optional)
    const twilioSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const twilioToken = this.configService.get('TWILIO_AUTH_TOKEN');
    if (twilioSid && twilioToken) {
      this.twilioClient = twilio(twilioSid, twilioToken);
    }

    // Initialize Web Push (optional)
    const vapidEmail = this.configService.get('VAPID_EMAIL');
    const vapidPublicKey = this.configService.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get('VAPID_PRIVATE_KEY');

    if (vapidEmail && vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(
        `mailto:${vapidEmail}`,
        vapidPublicKey,
        vapidPrivateKey,
      );
    } else {
      this.logger.warn(
        'Web Push (VAPID) is not configured. Set VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY to enable.',
      );
    }
  }

  /**
   * Save notification to DB, trigger Pusher event, and send push notification
   */
  async triggerNotification(userId: string, dto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      message: dto.message,
      eventType: dto.eventType,
      eventId: dto.eventId ?? dto.appointmentId,
      createdAt: dto.datetime ?? new Date(),
      read: false,
      channels: ['pusher', 'web-push'],
    });

    console.log(notification);
    const savedNotification =
      await this.notificationRepository.save(notification);

    if (this.pusher) {
      await this.pusher.trigger(
        `user-${userId}`,
        'new-notification',
        savedNotification,
      );
    }
    await this.sendPushNotification(userId, {
      title: dto.title || 'New Notification',
      body: dto.message,
      data: {
        id: savedNotification.id,
        eventType: dto.eventType,
        appointmentId: dto.appointmentId,
        url: dto.url || '/notifications',
      },
    });

    if (dto.sendWhatsApp && dto.userPhone) {
      await this.sendWhatsAppNotification(userId, dto.userPhone, dto);
    }

    return savedNotification;
  }

  async triggerTestNotification(userId: string, dto: TestNotificationDto) {
    const testDto: CreateNotificationDto = {
      message: dto.message,
      eventType: 'system',
      eventId: `test-${Date.now()}`,
      datetime: new Date().toISOString(),
      title: dto.title,
      url: dto.url,
      sendWhatsApp: false,
    };

    return this.triggerNotification(userId, testDto);
  }
  async sendWhatsAppNotification(
    userId: string,
    phoneNumber: string, // Format: 'whatsapp:+1234567890'
    dto: CreateNotificationDto,
  ) {
    // Save notification
    const notification = this.notificationRepository.create({
      user: { id: userId },
      message: dto.message,
      eventType: dto.eventType,
      eventId: dto.appointmentId,
      createdAt: dto.datetime ?? new Date().toISOString(),
      read: false,
      channels: ['whatsapp'],
    });

    const saved = await this.notificationRepository.save(notification);

    // Send WhatsApp
    await this.sendTwilioWhatsApp(phoneNumber, dto.message);

    return saved;
  }

  /**
   * Internal Twilio WhatsApp sender
   */
  private async sendTwilioWhatsApp(to: string, body: string) {
    if (!this.twilioClient) {
      this.logger.warn('Twilio is not configured — skipping WhatsApp message');
      return;
    }
    try {
      await this.twilioClient.messages.create({
        body,
        from: this.configService.get('TWILIO_WHATSAPP_NUMBER'),
        to,
      });
      console.log(`WhatsApp sent to ${to}`);
    } catch (error) {
      console.error('Twilio error:', error);
      throw new Error('Failed to send WhatsApp');
    }
  }

  /**
   * Trigger notifications for multiple users
   */
  async triggerPusherEvents(
    userIds: string[],
    dto: CreateNotificationDto,
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.triggerNotification(userId, dto)),
    );
  }

  async sendPushNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      data?: any;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    },
  ) {
    try {
      // Get all push subscriptions for the user
      const subscriptions = await this.pushSubscriptionRepository.find({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: (payload.data as Record<string, unknown>) || {},
        actions: payload.actions || [
          { action: 'view', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });

      // Send push notification to all user's subscriptions
      const pushPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dhKey,
                auth: sub.authKey,
              },
            },
            pushPayload,
            {
              TTL: 24 * 60 * 60, // 24 hours
            },
          );
          console.log(`Push notification sent to ${sub.endpoint}`);
        } catch (error) {
          console.error(
            `Failed to send push notification to ${sub.endpoint}:`,
            error,
          );

          // Remove invalid subscriptions
          if (
            (error as { statusCode?: number }).statusCode === 410 ||
            (error as { statusCode?: number }).statusCode === 404
          ) {
            await this.pushSubscriptionRepository.remove(sub);
            console.log(`Removed invalid subscription: ${sub.endpoint}`);
          }
        }
      });

      await Promise.allSettled(pushPromises);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  async subscribeToPush(dto: PushSubscriptionDto) {
    try {
      // Check if subscription already exists
      const existingSubscription =
        await this.pushSubscriptionRepository.findOne({
          where: {
            userId: dto.userId,
            endpoint: dto.subscription.endpoint,
          },
        });

      if (existingSubscription) {
        console.log('Push subscription already exists');
        return existingSubscription;
      }

      // Create new subscription
      const subscription = this.pushSubscriptionRepository.create({
        userId: dto.userId,
        endpoint: dto.subscription.endpoint,
        p256dhKey: dto.subscription.keys.p256dh,
        authKey: dto.subscription.keys.auth,
        createdAt: new Date(),
      });

      const saved = await this.pushSubscriptionRepository.save(subscription);
      console.log(`Push subscription created for user ${dto.userId}`);

      return saved;
    } catch (error) {
      console.error('Error creating push subscription:', error);
      throw error;
    }
  }

  async unsubscribeFromPush(userId: string, endpoint: string) {
    try {
      const subscription = await this.pushSubscriptionRepository.findOne({
        where: { userId, endpoint },
      });

      if (subscription) {
        await this.pushSubscriptionRepository.remove(subscription);
        console.log(`Push subscription removed for user ${userId}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing push subscription:', error);
      throw error;
    }
  }

  async getUserPushSubscriptions(userId: string) {
    return this.pushSubscriptionRepository.find({
      where: { userId },
    });
  }

  async triggerPusherEvent(
    channelIds: string[],
    event: string,
    data: any,
  ): Promise<void> {
    if (!this.pusher) return;
    try {
      const uniqueChannels = [...new Set(channelIds)];
      await Promise.all(
        uniqueChannels.map((channelId) =>
          this.pusher?.trigger(`user-${channelId}`, event, data),
        ),
      );
    } catch (error) {
      console.error('Pusher error:', error);
    }
  }

  async getUserNotifications(userId: string, page: number, limit: number) {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    return {
      data: notifications,
      total,
      page,
      limit,
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { user: { id: userId }, read: false },
      { read: true },
    );
    return { success: true };
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
    return { success: true };
  }
}
