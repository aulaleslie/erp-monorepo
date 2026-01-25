import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainerAvailabilityService } from './trainer-availability.service';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { OverrideType } from '@gym-monorepo/shared';

describe('TrainerAvailabilityService', () => {
  let service: TrainerAvailabilityService;
  let availabilityRepo: Repository<TrainerAvailabilityEntity>;
  let overrideRepo: Repository<TrainerAvailabilityOverrideEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerAvailabilityService,
        {
          provide: getRepositoryToken(TrainerAvailabilityEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TrainerAvailabilityOverrideEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<TrainerAvailabilityService>(
      TrainerAvailabilityService,
    );
    availabilityRepo = module.get<Repository<TrainerAvailabilityEntity>>(
      getRepositoryToken(TrainerAvailabilityEntity),
    );
    overrideRepo = module.get<Repository<TrainerAvailabilityOverrideEntity>>(
      getRepositoryToken(TrainerAvailabilityOverrideEntity),
    );
  });

  describe('getAvailableSlots', () => {
    it('should return template slots when no overrides exist', async () => {
      const tenantId = 'tenant-1';
      const trainerId = 'trainer-1';
      const date = '2026-01-26'; // Monday
      const dayOfWeek = 1;

      jest
        .spyOn(availabilityRepo, 'find')
        .mockResolvedValue([
          { startTime: '09:00', endTime: '12:00' } as any,
          { startTime: '14:00', endTime: '18:00' } as any,
        ]);
      jest.spyOn(overrideRepo, 'find').mockResolvedValue([]);

      const result = await service.getAvailableSlots(tenantId, trainerId, date);

      expect(result).toEqual([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '18:00' },
      ]);
      expect(availabilityRepo.find).toHaveBeenCalledWith({
        where: { tenantId, trainerId, dayOfWeek, isActive: true },
        order: { startTime: 'ASC' },
      });
    });

    it('should return empty array if day is BLOCKED', async () => {
      const tenantId = 'tenant-1';
      const trainerId = 'trainer-1';
      const date = '2026-01-26';

      jest
        .spyOn(availabilityRepo, 'find')
        .mockResolvedValue([{ startTime: '09:00', endTime: '12:00' } as any]);
      jest.spyOn(overrideRepo, 'find').mockResolvedValue([
        {
          overrideType: OverrideType.BLOCKED,
          startTime: null,
          endTime: null,
        } as any,
      ]);

      const result = await service.getAvailableSlots(tenantId, trainerId, date);

      expect(result).toEqual([]);
    });

    it('should apply partial BLOCKED overrides', async () => {
      const tenantId = 'tenant-1';
      const trainerId = 'trainer-1';
      const date = '2026-01-26';

      jest
        .spyOn(availabilityRepo, 'find')
        .mockResolvedValue([{ startTime: '09:00', endTime: '18:00' } as any]);
      jest.spyOn(overrideRepo, 'find').mockResolvedValue([
        {
          overrideType: OverrideType.BLOCKED,
          startTime: '12:00',
          endTime: '13:00',
        } as any,
      ]);

      const result = await service.getAvailableSlots(tenantId, trainerId, date);

      expect(result).toEqual([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '18:00' },
      ]);
    });

    it('should replace template with MODIFIED overrides', async () => {
      const tenantId = 'tenant-1';
      const trainerId = 'trainer-1';
      const date = '2026-01-26';

      jest
        .spyOn(availabilityRepo, 'find')
        .mockResolvedValue([{ startTime: '09:00', endTime: '12:00' } as any]);
      jest.spyOn(overrideRepo, 'find').mockResolvedValue([
        {
          overrideType: OverrideType.MODIFIED,
          startTime: '10:00',
          endTime: '11:00',
        } as any,
      ]);

      const result = await service.getAvailableSlots(tenantId, trainerId, date);

      expect(result).toEqual([{ startTime: '10:00', endTime: '11:00' }]);
    });
  });
});
