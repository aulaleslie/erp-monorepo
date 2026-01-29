import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async findAll(tenantId: string, userId: string, query: NotificationQueryDto) {
    const { unreadOnly, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<NotificationEntity> = { tenantId, userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async getUnreadCount(tenantId: string, userId: string) {
    return await this.notificationRepo.count({
      where: { tenantId, userId, isRead: false },
    });
  }

  async markAsRead(tenantId: string, userId: string, id: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, tenantId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return notification;
  }

  async markAllAsRead(tenantId: string, userId: string) {
    await this.notificationRepo.update(
      { tenantId, userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async createNotification(data: Partial<NotificationEntity>) {
    const notification = this.notificationRepo.create(data);
    return await this.notificationRepo.save(notification);
  }
}
