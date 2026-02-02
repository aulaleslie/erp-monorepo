import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantSchedulingSettingsService } from './tenant-scheduling-settings.service';
import { TenantSchedulingSettingsEntity } from '../../../database/entities/tenant-scheduling-settings.entity';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { Repository } from 'typeorm';

describe('TenantSchedulingSettingsService', () => {
  let service: TenantSchedulingSettingsService;
  let repository: Repository<TenantSchedulingSettingsEntity>;
  let tenantRepository: Repository<TenantEntity>;

  const mockTenantId = 'tenant-123';
  const mockSettings = {
    tenantId: mockTenantId,
    slotDurationMinutes: 30,
    bookingLeadTimeHours: 12,
    cancellationWindowHours: 48,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantSchedulingSettingsService,
        {
          provide: getRepositoryToken(TenantSchedulingSettingsEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantSchedulingSettingsService>(
      TenantSchedulingSettingsService,
    );
    repository = module.get<Repository<TenantSchedulingSettingsEntity>>(
      getRepositoryToken(TenantSchedulingSettingsEntity),
    );
    tenantRepository = module.get<Repository<TenantEntity>>(
      getRepositoryToken(TenantEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return settings if they exist', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue({ ...mockSettings } as any);

      const result = await service.getSettings(mockTenantId);

      expect(result).toEqual({
        slotDurationMinutes: 30,
        bookingLeadTimeHours: 12,
        cancellationWindowHours: 48,
      });
    });

    it('should return defaults if settings do not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.getSettings(mockTenantId);

      expect(result).toEqual({
        slotDurationMinutes: 60,
        bookingLeadTimeHours: 0,
        cancellationWindowHours: 24,
      });
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      jest
        .spyOn(tenantRepository, 'findOne')
        .mockResolvedValue({ id: mockTenantId } as any);
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue({ ...mockSettings } as any);
      jest.spyOn(repository, 'save').mockImplementation(async (s) => s as any);

      const result = await service.updateSettings(mockTenantId, {
        slotDurationMinutes: 45,
      });

      expect(result.slotDurationMinutes).toBe(45);
    });

    it('should create new settings if they do not exist', async () => {
      jest
        .spyOn(tenantRepository, 'findOne')
        .mockResolvedValue({ id: mockTenantId } as any);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'create')
        .mockReturnValue({ ...mockSettings } as any);
      jest.spyOn(repository, 'save').mockImplementation(async (s) => s as any);

      const result = await service.updateSettings(mockTenantId, {
        ...mockSettings,
      });

      expect(result.slotDurationMinutes).toBe(30);
    });
  });
});
