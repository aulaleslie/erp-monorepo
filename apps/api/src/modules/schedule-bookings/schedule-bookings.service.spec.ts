import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleBookingsService } from './schedule-bookings.service';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { TenantSchedulingSettingsEntity } from '../../database/entities/tenant-scheduling-settings.entity';
import { BookingStatus, OverrideType } from '@gym-monorepo/shared';

describe('ScheduleBookingsService', () => {
  let service: ScheduleBookingsService;
  let bookingRepo: Repository<ScheduleBookingEntity>;
  let availabilityRepo: Repository<TrainerAvailabilityEntity>;
  let overrideRepo: Repository<TrainerAvailabilityOverrideEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleBookingsService,
        {
          provide: getRepositoryToken(ScheduleBookingEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TrainerAvailabilityEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TrainerAvailabilityOverrideEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PtPackageEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TenantSchedulingSettingsEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ScheduleBookingsService>(ScheduleBookingsService);
    bookingRepo = module.get<Repository<ScheduleBookingEntity>>(
      getRepositoryToken(ScheduleBookingEntity),
    );
    availabilityRepo = module.get<Repository<TrainerAvailabilityEntity>>(
      getRepositoryToken(TrainerAvailabilityEntity),
    );
    overrideRepo = module.get<Repository<TrainerAvailabilityOverrideEntity>>(
      getRepositoryToken(TrainerAvailabilityOverrideEntity),
    );
  });

  describe('getCalendarData', () => {
    it('should return bookings and computed availability for date range', async () => {
      const tenantId = 'tenant-1';
      const trainerId = 'trainer-1';
      const dateFrom = '2026-01-26'; // Monday
      const dateTo = '2026-01-27'; // Tuesday

      // Mock Bookings
      const mockBookings = [
        {
          id: 'booking-1',
          bookingDate: '2026-01-26',
          startTime: '10:00',
          endTime: '11:00',
          trainerId,
          status: BookingStatus.SCHEDULED,
        },
      ];
      jest
        .spyOn(bookingRepo, 'find')
        .mockResolvedValue(mockBookings as unknown as ScheduleBookingEntity[]);

      // Mock Templates (Mon & Tue)
      const mockTemplates = [
        {
          trainerId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        }, // Mon
        {
          trainerId,
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        }, // Tue
      ];
      jest
        .spyOn(availabilityRepo, 'find')
        .mockResolvedValue(
          mockTemplates as unknown as TrainerAvailabilityEntity[],
        );

      // Mock Overrides (Block lunch on Monday)
      const mockOverrides = [
        {
          trainerId,
          date: '2026-01-26',
          overrideType: OverrideType.BLOCKED,
          startTime: '12:00',
          endTime: '13:00',
        },
      ];
      jest
        .spyOn(overrideRepo, 'find')
        .mockResolvedValue(
          mockOverrides as unknown as TrainerAvailabilityOverrideEntity[],
        );

      const result = await service.getCalendarData(tenantId, {
        dateFrom,
        dateTo,
        trainerIds: trainerId,
      });

      expect(result.bookings).toHaveLength(1);
      expect(result.bookings[0].id).toBe('booking-1');

      const availability = result.availability[trainerId];
      expect(availability).toBeDefined();

      // Monday 26th: 9-12, 13-17 (split by override)
      const monSlots = availability['2026-01-26'];
      expect(monSlots).toHaveLength(2);
      expect(monSlots[0]).toEqual({ startTime: '09:00', endTime: '12:00' });
      expect(monSlots[1]).toEqual({ startTime: '13:00', endTime: '17:00' });

      // Tuesday 27th: 9-17 (no override)
      const tueSlots = availability['2026-01-27'];
      expect(tueSlots).toHaveLength(1);
      expect(tueSlots[0]).toEqual({ startTime: '09:00', endTime: '17:00' });
    });

    it('should handle full day blocked override', async () => {
      const tenantId = 'tenant-1';
      const trainerId = 'trainer-1';
      const dateFrom = '2026-01-26';
      const dateTo = '2026-01-26';

      jest.spyOn(bookingRepo, 'find').mockResolvedValue([]);
      jest.spyOn(availabilityRepo, 'find').mockResolvedValue([
        {
          trainerId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        },
      ] as unknown as TrainerAvailabilityEntity[]);
      jest.spyOn(overrideRepo, 'find').mockResolvedValue([
        {
          trainerId,
          date: '2026-01-26',
          overrideType: OverrideType.BLOCKED,
          startTime: null, // Full day
          endTime: null,
        },
      ] as unknown as TrainerAvailabilityOverrideEntity[]);

      const result = await service.getCalendarData(tenantId, {
        dateFrom,
        dateTo,
        trainerIds: trainerId,
      });
      expect(result.availability[trainerId]['2026-01-26']).toEqual([]);
    });

    it('should handle modified hours override', async () => {
      const tenantId = 'tenant-1';
      const trainerId = 'trainer-1';
      const dateFrom = '2026-01-26';
      const dateTo = '2026-01-26';

      jest.spyOn(bookingRepo, 'find').mockResolvedValue([]);
      jest.spyOn(availabilityRepo, 'find').mockResolvedValue([
        {
          trainerId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        },
      ] as unknown as TrainerAvailabilityEntity[]);
      jest.spyOn(overrideRepo, 'find').mockResolvedValue([
        {
          trainerId,
          date: '2026-01-26',
          overrideType: OverrideType.MODIFIED,
          startTime: '10:00',
          endTime: '14:00',
        },
      ] as unknown as TrainerAvailabilityOverrideEntity[]);

      const result = await service.getCalendarData(tenantId, {
        dateFrom,
        dateTo,
        trainerIds: trainerId,
      });
      expect(result.availability[trainerId]['2026-01-26']).toEqual([
        { startTime: '10:00', endTime: '14:00' },
      ]);
    });
  });
});
