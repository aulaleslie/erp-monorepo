import { Test, TestingModule } from '@nestjs/testing';
import { ExpiryProcessor } from './expiry.processor';
import { PtSessionPackagesService } from '../../pt-session-packages/pt-session-packages.service';
import { MembershipsService } from '../../memberships/memberships.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UsersService } from '../../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationLogEntity } from '../../../database/entities/notification-log.entity';
import { JOB_NAMES } from '../queue.constants';
import { Job } from 'bullmq';

describe('ExpiryProcessor', () => {
  let processor: ExpiryProcessor;
  let ptPackagesService: PtSessionPackagesService;

  const mockPtPackagesService = {
    processExpiries: jest.fn(),
  };

  const mockMembershipsService = {
    processExpiries: jest.fn(),
    findExpiringMemberships: jest.fn(),
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  const mockUsersService = {
    findAllWithPermission: jest.fn(),
  };

  const mockNotificationLogRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpiryProcessor,
        {
          provide: PtSessionPackagesService,
          useValue: mockPtPackagesService,
        },
        {
          provide: MembershipsService,
          useValue: mockMembershipsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: getRepositoryToken(NotificationLogEntity),
          useValue: mockNotificationLogRepo,
        },
      ],
    }).compile();

    processor = module.get<ExpiryProcessor>(ExpiryProcessor);
    ptPackagesService = module.get<PtSessionPackagesService>(
      PtSessionPackagesService,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should call handlePtPackageExpiry when job name is PT_PACKAGE_EXPIRY', async () => {
      const job = { name: JOB_NAMES.PT_PACKAGE_EXPIRY } as Job;
      await processor.process(job);
      expect(ptPackagesService.processExpiries).toHaveBeenCalled();
    });

    it('should call handleMembershipExpiry when job name is MEMBERSHIP_EXPIRY', async () => {
      const job = { name: JOB_NAMES.MEMBERSHIP_EXPIRY } as Job;
      await processor.process(job);
      expect(mockMembershipsService.processExpiries).toHaveBeenCalled();
    });

    it('should call handleExpiryNotifications when job name is EXPIRY_NOTIFICATION', async () => {
      const job = { name: JOB_NAMES.EXPIRY_NOTIFICATION } as Job;

      // Mock data
      const mockMembership = {
        id: 'mem-1',
        tenantId: 'tenant-1',
        member: {
          memberCode: 'M001',
          person: {
            fullName: 'John Doe',
          },
        },
      };

      const mockAdmin = {
        id: 'admin-1',
      };

      // Setup mocks
      mockMembershipsService.findExpiringMemberships.mockImplementation(
        (days) => {
          if (days === 7) return [mockMembership]; // Only find for 7 days
          return [];
        },
      );

      mockNotificationLogRepo.findOne.mockResolvedValue(null); // No log exists
      mockUsersService.findAllWithPermission.mockResolvedValue([mockAdmin]);

      await processor.process(job);

      // Verify findExpiringMemberships called for all intervals
      expect(
        mockMembershipsService.findExpiringMemberships,
      ).toHaveBeenCalledWith(7);
      expect(
        mockMembershipsService.findExpiringMemberships,
      ).toHaveBeenCalledWith(5);
      expect(
        mockMembershipsService.findExpiringMemberships,
      ).toHaveBeenCalledWith(3);
      expect(
        mockMembershipsService.findExpiringMemberships,
      ).toHaveBeenCalledWith(1);

      // Verify notification created
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'admin-1',
        type: 'MEMBERSHIP_EXPIRING', // NotificationType enum value
        title: 'Membership Expiring Soon',
        message: 'Member John Doe (M001) membership expires in 7 days.',
        referenceType: 'membership',
        referenceId: 'mem-1',
      });

      // Verify log saved
      expect(mockNotificationLogRepo.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        notificationType: 'MEMBERSHIP_EXPIRING',
        referenceId: 'mem-1',
        daysBefore: 7,
      });
      expect(mockNotificationLogRepo.save).toHaveBeenCalled();
    });

    it('should not send duplicate notifications', async () => {
      const job = { name: JOB_NAMES.EXPIRY_NOTIFICATION } as Job;
      const mockMembership = {
        id: 'mem-1',
        tenantId: 'tenant-1',
      };

      mockMembershipsService.findExpiringMemberships.mockReturnValue([
        mockMembership,
      ]);
      mockNotificationLogRepo.findOne.mockResolvedValue({ id: 'log-1' }); // Log exists

      await processor.process(job);

      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
      expect(mockNotificationLogRepo.save).not.toHaveBeenCalled();
    });
  });
});
