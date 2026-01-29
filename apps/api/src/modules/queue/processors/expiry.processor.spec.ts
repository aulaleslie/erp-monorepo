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
  });
});
