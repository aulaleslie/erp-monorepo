import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { NotificationQueryDto } from './dto/notification-query.dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const tenantId = 'tenant-1';
  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            findAll: jest.fn(),
            getUnreadCount: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(ActiveTenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('findAll', () => {
    it('should call notificationsService.findAll', async () => {
      const query: NotificationQueryDto = { page: 1, limit: 10 };
      await controller.findAll(tenantId, userId, query);
      expect(service.findAll).toHaveBeenCalledWith(tenantId, userId, query);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count from service', async () => {
      (service.getUnreadCount as jest.Mock).mockResolvedValue(10);
      const result = await controller.getUnreadCount(tenantId, userId);
      expect(service.getUnreadCount).toHaveBeenCalledWith(tenantId, userId);
      expect(result).toEqual({ count: 10 });
    });
  });

  describe('markAsRead', () => {
    it('should call notificationsService.markAsRead', async () => {
      const id = 'notif-1';
      await controller.markAsRead(tenantId, userId, id);
      expect(service.markAsRead).toHaveBeenCalledWith(tenantId, userId, id);
    });
  });

  describe('markAllAsRead', () => {
    it('should call notificationsService.markAllAsRead', async () => {
      await controller.markAllAsRead(tenantId, userId);
      expect(service.markAllAsRead).toHaveBeenCalledWith(tenantId, userId);
    });
  });
});
