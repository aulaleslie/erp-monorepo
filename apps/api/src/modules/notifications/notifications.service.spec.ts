import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Repository<NotificationEntity>;

  const tenantId = 'tenant-1';
  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: {
            findAndCount: jest.fn(),
            count: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<Repository<NotificationEntity>>(
      getRepositoryToken(NotificationEntity),
    );
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const query: NotificationQueryDto = {
        unreadOnly: false,
        page: 1,
        limit: 10,
      };
      const items = [{ id: '1', title: 'Test' }];
      const total = 1;

      (repository.findAndCount as jest.Mock).mockResolvedValue([items, total]);

      const result = await service.findAll(tenantId, userId, query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId, userId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ items, total, page: 1, limit: 10 });
    });

    it('should filter by unreadOnly', async () => {
      const query: NotificationQueryDto = {
        unreadOnly: true,
        page: 1,
        limit: 10,
      };
      (repository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll(tenantId, userId, query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, userId, isRead: false },
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      (repository.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getUnreadCount(tenantId, userId);

      expect(repository.count).toHaveBeenCalledWith({
        where: { tenantId, userId, isRead: false },
      });
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const id = 'notif-1';
      const notification = { id, tenantId, userId, isRead: false };
      (repository.findOne as jest.Mock).mockResolvedValue(notification);

      const result = await service.markAsRead(tenantId, userId, id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId, userId },
      });
      expect(notification.isRead).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(notification);
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.markAsRead(tenantId, userId, 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not save if already read', async () => {
      const notification = { id: '1', isRead: true };
      (repository.findOne as jest.Mock).mockResolvedValue(notification);

      await service.markAsRead(tenantId, userId, '1');

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications', async () => {
      await service.markAllAsRead(tenantId, userId);

      expect(repository.update).toHaveBeenCalledWith(
        { tenantId, userId, isRead: false },
        { isRead: true, readAt: expect.any(Date) as Date },
      );
    });
  });

  describe('createNotification', () => {
    it('should create and save notification', async () => {
      const data = { title: 'New' };
      const notification = { ...data, id: '1' };
      (repository.create as jest.Mock).mockReturnValue(notification);
      (repository.save as jest.Mock).mockResolvedValue(notification);

      const result = await service.createNotification(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(notification);
      expect(result).toEqual(notification);
    });
  });
});
