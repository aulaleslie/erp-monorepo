import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AttendanceType,
  BookingStatus,
  BookingType,
  CheckInMethod,
  PtPackageStatus,
} from '@gym-monorepo/shared';
import { AttendanceService } from './attendance.service';
import { AttendanceRecordEntity } from '../../database/entities/attendance-record.entity';
import { MemberEntity } from '../../database/entities/member.entity';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { CheckInDto } from './dto/check-in.dto';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: Repository<AttendanceRecordEntity>;
  let memberRepo: Repository<MemberEntity>;
  let bookingRepo: Repository<ScheduleBookingEntity>;
  let ptPackageRepo: Repository<PtPackageEntity>;
  let groupSessionRepo: Repository<GroupSessionEntity>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === ScheduleBookingEntity) return bookingRepo;
        if (entity === PtPackageEntity) return ptPackageRepo;
        if (entity === GroupSessionEntity) return groupSessionRepo;
        if (entity === AttendanceRecordEntity) return attendanceRepo;
        return null;
      }),
    },
  };

  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation((cb: (manager: any) => Promise<any>) =>
        cb(mockQueryRunner.manager),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(AttendanceRecordEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MemberEntity),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ScheduleBookingEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PtPackageEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupSessionEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepo = module.get<Repository<AttendanceRecordEntity>>(
      getRepositoryToken(AttendanceRecordEntity),
    );
    memberRepo = module.get<Repository<MemberEntity>>(
      getRepositoryToken(MemberEntity),
    );
    bookingRepo = module.get<Repository<ScheduleBookingEntity>>(
      getRepositoryToken(ScheduleBookingEntity),
    );
    ptPackageRepo = module.get<Repository<PtPackageEntity>>(
      getRepositoryToken(PtPackageEntity),
    );
    groupSessionRepo = module.get<Repository<GroupSessionEntity>>(
      getRepositoryToken(GroupSessionEntity),
    );
  });

  describe('checkIn', () => {
    it('should check in a member by ID', async () => {
      const dto = {
        memberId: 'member-123',
        attendanceType: AttendanceType.GYM_ENTRY,
        checkInMethod: CheckInMethod.MANUAL,
      };

      const mockMember = {
        id: 'member-123',
        currentExpiryDate: new Date(Date.now() + 86400000).toISOString(),
      };

      jest
        .spyOn(memberRepo, 'findOne')
        .mockResolvedValue(mockMember as unknown as MemberEntity);
      jest
        .spyOn(attendanceRepo, 'create')
        .mockReturnValue({ id: 'att-1' } as unknown as AttendanceRecordEntity);
      mockQueryRunner.manager.save.mockResolvedValue({ id: 'att-1' });

      const result = await service.checkIn(mockTenantId, mockUserId, dto);

      expect(memberRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.memberId, tenantId: mockTenantId },
      });
      expect(result).toEqual({ id: 'att-1' });
    });

    it('should throw NotFoundException if member not found', async () => {
      jest.spyOn(memberRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.checkIn(mockTenantId, mockUserId, {
          memberId: 'invalid',
        } as unknown as CheckInDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if membership expired', async () => {
      const mockMember = {
        id: 'member-123',
        currentExpiryDate: new Date(Date.now() - 86400000).toISOString(),
      };

      jest
        .spyOn(memberRepo, 'findOne')
        .mockResolvedValue(mockMember as unknown as MemberEntity);

      await expect(
        service.checkIn(mockTenantId, mockUserId, {
          memberId: 'member-123',
        } as unknown as CheckInDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle PT_SESSION check-in and deduct session', async () => {
      const dto = {
        memberId: 'member-123',
        attendanceType: AttendanceType.PT_SESSION,
        checkInMethod: CheckInMethod.MANUAL,
      };

      const mockMember = {
        id: 'member-123',
        currentExpiryDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockBooking = {
        id: 'booking-123',
        bookingType: BookingType.PT_SESSION,
        ptPackageId: 'pkg-123',
        status: BookingStatus.SCHEDULED,
        bookingDate: new Date().toISOString().split('T')[0],
      };

      const mockPackage = {
        id: 'pkg-123',
        remainingSessions: 10,
        usedSessions: 0,
        status: PtPackageStatus.ACTIVE,
      };

      jest
        .spyOn(memberRepo, 'findOne')
        .mockResolvedValue(mockMember as unknown as MemberEntity);
      jest
        .spyOn(bookingRepo, 'findOne')
        .mockResolvedValue(mockBooking as unknown as ScheduleBookingEntity);
      jest
        .spyOn(ptPackageRepo, 'findOne')
        .mockResolvedValue(mockPackage as unknown as PtPackageEntity);
      jest
        .spyOn(attendanceRepo, 'create')
        .mockReturnValue({ id: 'att-1' } as unknown as AttendanceRecordEntity);
      mockQueryRunner.manager.save.mockResolvedValue({ id: 'att-1' });

      const result = await service.checkIn(mockTenantId, mockUserId, dto);

      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        PtPackageEntity,
        expect.any(Object),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        ScheduleBookingEntity,
        expect.any(Object),
      );
      expect(result).toEqual({ id: 'att-1' });
    });
  });

  describe('checkOut', () => {
    it('should set checkOutAt for an open attendance record', async () => {
      const mockRecord = { id: 'att-1', checkOutAt: null };
      jest
        .spyOn(attendanceRepo, 'findOne')
        .mockResolvedValue(mockRecord as unknown as AttendanceRecordEntity);
      jest
        .spyOn(attendanceRepo, 'save')
        .mockImplementation((r: any) => Promise.resolve(r));

      const result = await service.checkOut(mockTenantId, 'att-1');

      expect(result.checkOutAt).toBeDefined();
      expect(attendanceRepo.save).toHaveBeenCalledWith(mockRecord);
    });

    it('should throw NotFoundException if no open record found', async () => {
      jest.spyOn(attendanceRepo, 'findOne').mockResolvedValue(null);

      await expect(service.checkOut(mockTenantId, 'att-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
