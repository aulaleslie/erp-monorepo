import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { ScheduleBookingsService } from './schedule-bookings.service';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { TenantSchedulingSettingsEntity } from '../../database/entities/tenant-scheduling-settings.entity';
import {
  BookingStatus,
  BookingType,
  OverrideType,
  BOOKING_ERRORS,
  ConflictType,
  GroupSessionStatus,
} from '@gym-monorepo/shared';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { BadRequestException } from '@nestjs/common';
import { ConflictDetail } from './dto/conflict-check.dto';

interface ConflictResponse {
  message: string;
  error: string;
  detail: ConflictDetail;
}

describe('ScheduleBookingsService', () => {
  let service: ScheduleBookingsService;
  let bookingRepo: Repository<ScheduleBookingEntity>;
  let availabilityRepo: Repository<TrainerAvailabilityEntity>;
  let overrideRepo: Repository<TrainerAvailabilityOverrideEntity>;
  let managerMock: Partial<EntityManager>;

  beforeEach(async () => {
    const bookingRepoMock = {
      create: jest.fn().mockImplementation((entity: unknown) => entity),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const availabilityRepoMock = { find: jest.fn(), findOne: jest.fn() };
    const overrideRepoMock = { find: jest.fn() };
    const ptPackageRepoMock = { findOne: jest.fn(), save: jest.fn() };
    const settingsRepoMock = { findOne: jest.fn() };
    const groupSessionRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    managerMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      getRepository: jest.fn().mockImplementation((entity: unknown) => {
        const name =
          typeof entity === 'function'
            ? (entity as { name: string }).name
            : entity;
        if (
          entity === ScheduleBookingEntity ||
          name === 'ScheduleBookingEntity'
        )
          return bookingRepoMock;
        if (
          entity === TrainerAvailabilityEntity ||
          name === 'TrainerAvailabilityEntity'
        )
          return availabilityRepoMock;
        if (
          entity === TrainerAvailabilityOverrideEntity ||
          name === 'TrainerAvailabilityOverrideEntity'
        )
          return overrideRepoMock;
        if (entity === PtPackageEntity || name === 'PtPackageEntity')
          return ptPackageRepoMock;
        if (entity === GroupSessionEntity || name === 'GroupSessionEntity')
          return groupSessionRepoMock;
        console.error('getRepository failed to match entity:', name);
        return null;
      }),
      createQueryBuilder: jest
        .fn()
        .mockImplementation((_entityOrMetadata, _alias) => {
          const qb = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          };
          return qb;
        }),
    };

    const mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          (cb: (manager: typeof managerMock) => Promise<unknown>) => {
            return cb(managerMock);
          },
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleBookingsService,
        {
          provide: getRepositoryToken(ScheduleBookingEntity),
          useValue: bookingRepoMock,
        },
        {
          provide: getRepositoryToken(TrainerAvailabilityEntity),
          useValue: availabilityRepoMock,
        },
        {
          provide: getRepositoryToken(TrainerAvailabilityOverrideEntity),
          useValue: overrideRepoMock,
        },
        {
          provide: getRepositoryToken(PtPackageEntity),
          useValue: ptPackageRepoMock,
        },
        {
          provide: getRepositoryToken(TenantSchedulingSettingsEntity),
          useValue: settingsRepoMock,
        },
        {
          provide: getRepositoryToken(GroupSessionEntity),
          useValue: groupSessionRepoMock,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ScheduleBookingsService>(ScheduleBookingsService);
    bookingRepo = module.get(getRepositoryToken(ScheduleBookingEntity));
    availabilityRepo = module.get(
      getRepositoryToken(TrainerAvailabilityEntity),
    );
    overrideRepo = module.get(
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

  describe('create - conflict detection', () => {
    const tenantId = 'tenant-1';
    const trainerId = 'trainer-1';
    const memberId = 'member-1';
    const dto = {
      trainerId,
      memberId,
      bookingDate: '2026-02-01', // Sunday
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      bookingType: BookingType.PT_SESSION,
    };

    beforeEach(() => {
      // Mock repository create since it's used in the service
      (bookingRepo.create as jest.Mock).mockImplementation(
        (entity: unknown) => entity,
      );

      // Default: 60 min slots
      (managerMock.findOne as jest.Mock).mockResolvedValue({
        slotDurationMinutes: 60,
      });

      // Default: Trainer available 9-17 on Sundays (0)
      jest.spyOn(availabilityRepo, 'find').mockResolvedValue([
        {
          trainerId,
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        } as TrainerAvailabilityEntity,
      ]);

      (overrideRepo.find as jest.Mock).mockResolvedValue([]);

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      (bookingRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );
    });

    it('should throw if outside trainer availability', async () => {
      // Mock no availability template
      (availabilityRepo.find as jest.Mock).mockResolvedValue([]);

      try {
        await service.create(tenantId, dto);
        fail('Should have thrown');
      } catch (e) {
        console.error('Test error:', e);
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (
          e as BadRequestException
        ).getResponse() as ConflictResponse;
        expect(response.message).toBe(BOOKING_ERRORS.CONFLICT);
        expect(response.detail.type).toBe(ConflictType.OUTSIDE_AVAILABILITY);
      }
    });

    it('should throw if trainer has blocked override', async () => {
      (overrideRepo.find as jest.Mock).mockResolvedValue([
        {
          overrideType: OverrideType.BLOCKED,
          date: '2026-02-01',
          startTime: '10:00',
          endTime: '12:00', // Blocks 10-11
        },
      ]);

      try {
        await service.create(tenantId, dto);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (
          e as BadRequestException
        ).getResponse() as ConflictResponse;
        expect(response.detail.type).toBe(ConflictType.BLOCKED_OVERRIDE);
      }
    });

    it('should throw if double booked', async () => {
      // Mock existing booking collision
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 'existing-booking',
          startTime: '10:00',
          endTime: '11:00',
        }),
      };
      (bookingRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilderMock,
      );

      try {
        await service.create(tenantId, dto);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (
          e as BadRequestException
        ).getResponse() as ConflictResponse;
        expect(response.detail.type).toBe(ConflictType.TRAINER_DOUBLE_BOOKED);
        expect(response.detail.conflictingBookingId).toBe('existing-booking');
      }
    });

    it('should allow if modified override makes it available', async () => {
      // Template says unavailable (empty), but override says available
      (availabilityRepo.find as jest.Mock).mockResolvedValue([]);
      (overrideRepo.find as jest.Mock).mockResolvedValue([
        {
          overrideType: OverrideType.MODIFIED,
          startTime: '08:00',
          endTime: '12:00',
        } as TrainerAvailabilityOverrideEntity,
      ]);

      // Need to mock pt package success too
      (managerMock.findOne as jest.Mock).mockImplementation((entity) => {
        if (entity === TenantSchedulingSettingsEntity)
          return { slotDurationMinutes: 60 };
        if (entity === PtPackageEntity)
          return { id: 'pkg-1', status: 'ACTIVE', remainingSessions: 5 };
        return null;
      });

      // Mock save to return booking
      (managerMock.save as jest.Mock).mockResolvedValue({ id: 'new-booking' });

      await service.create(tenantId, dto);
      expect(managerMock.save).toHaveBeenCalled();
    });

    describe('group sessions', () => {
      const groupDto = {
        ...dto,
        bookingType: BookingType.GROUP_SESSION,
        groupSessionId: 'gs-1',
      };

      it('should validate group session balance when groupSessionId is provided', async () => {
        (managerMock.findOne as jest.Mock).mockImplementation((entity) => {
          if (entity === TenantSchedulingSettingsEntity)
            return { slotDurationMinutes: 60 };
          if (entity === GroupSessionEntity)
            return {
              id: 'gs-1',
              status: GroupSessionStatus.ACTIVE,
              remainingSessions: 5,
            };
          return null;
        });

        await service.create(tenantId, groupDto);
        expect(managerMock.save).toHaveBeenCalled();
      });

      it('should throw if group session is insufficient', async () => {
        (managerMock.findOne as jest.Mock).mockImplementation((entity) => {
          if (entity === TenantSchedulingSettingsEntity)
            return { slotDurationMinutes: 60 };
          if (entity === GroupSessionEntity)
            return {
              id: 'gs-1',
              status: GroupSessionStatus.ACTIVE,
              remainingSessions: 0,
            };
          return null;
        });

        await expect(service.create(tenantId, groupDto)).rejects.toThrow(
          'Insufficient group sessions',
        );
      });

      it('should auto-find group session if not provided', async () => {
        const dtoNoId = { ...groupDto, groupSessionId: undefined };

        const mockGs = { id: 'gs-auto', status: GroupSessionStatus.ACTIVE };
        const qbGsSearchMock = {
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(mockGs),
        };

        const qbLockMock = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          setLock: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        };

        (managerMock.createQueryBuilder as jest.Mock).mockImplementation(
          (_entityOrMetadata) => {
            if (_entityOrMetadata === GroupSessionEntity) return qbGsSearchMock;
            return qbLockMock;
          },
        );

        (managerMock.findOne as jest.Mock).mockImplementation((entity) => {
          if (entity === TenantSchedulingSettingsEntity)
            return { slotDurationMinutes: 60 };
          return null;
        });

        await service.create(tenantId, dtoNoId);
        expect(qbGsSearchMock.getOne).toHaveBeenCalled();
        expect(managerMock.save).toHaveBeenCalledWith(
          ScheduleBookingEntity,
          expect.objectContaining({ groupSessionId: 'gs-auto' }),
        );
      });
    });
  });

  describe('complete and no-show group sessions', () => {
    const tenantId = 'tenant-1';
    const bookingId = 'booking-1';
    const groupSessionId = 'gs-1';

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: bookingId,
        tenantId,
        status: BookingStatus.SCHEDULED,
        bookingType: BookingType.GROUP_SESSION,
        groupSessionId,
      } as unknown as ScheduleBookingEntity);

      (managerMock.save as jest.Mock).mockImplementation((entity) =>
        Promise.resolve(entity),
      );
    });

    it('should deduct group session on complete', async () => {
      const mockGs = {
        id: groupSessionId,
        remainingSessions: 5,
        usedSessions: 2,
        status: GroupSessionStatus.ACTIVE,
      };
      (
        managerMock.getRepository!(GroupSessionEntity).findOne as jest.Mock
      ).mockResolvedValue(mockGs);

      await service.complete(tenantId, bookingId);

      expect(mockGs.remainingSessions).toBe(4);
      expect(mockGs.usedSessions).toBe(3);
      expect(
        managerMock.getRepository!(GroupSessionEntity).save,
      ).toHaveBeenCalledWith(mockGs);
    });

    it('should deduct group session on no-show', async () => {
      const mockGs = {
        id: groupSessionId,
        remainingSessions: 1,
        usedSessions: 9,
        status: GroupSessionStatus.ACTIVE,
      };
      (
        managerMock.getRepository!(GroupSessionEntity).findOne as jest.Mock
      ).mockResolvedValue(mockGs);

      await service.noShow(tenantId, bookingId);

      expect(mockGs.remainingSessions).toBe(0);
      expect(mockGs.status).toBe(GroupSessionStatus.EXHAUSTED);
    });
  });
});
