import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  In,
  FindOptionsWhere,
} from 'typeorm';
import {
  BookingStatus,
  BookingType,
  BOOKING_ERRORS,
  PtPackageStatus,
  OverrideType,
  GroupSessionStatus,
} from '@gym-monorepo/shared';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { TenantSchedulingSettingsEntity } from '../../database/entities/tenant-scheduling-settings.entity';
import { ConflictType } from '@gym-monorepo/shared';
import { ConflictDetail } from './dto/conflict-check.dto';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class ScheduleBookingsService {
  constructor(
    @InjectRepository(ScheduleBookingEntity)
    private readonly bookingRepo: Repository<ScheduleBookingEntity>,
    @InjectRepository(TrainerAvailabilityEntity)
    private readonly availabilityRepo: Repository<TrainerAvailabilityEntity>,
    @InjectRepository(TrainerAvailabilityOverrideEntity)
    private readonly overrideRepo: Repository<TrainerAvailabilityOverrideEntity>,
    @InjectRepository(PtPackageEntity)
    private readonly ptPackageRepo: Repository<PtPackageEntity>,
    @InjectRepository(GroupSessionEntity)
    private readonly groupSessionRepo: Repository<GroupSessionEntity>,
    @InjectRepository(TenantSchedulingSettingsEntity)
    private readonly settingsRepo: Repository<TenantSchedulingSettingsEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(tenantId: string, dto: CreateBookingDto) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Validate slot duration
      const settings = await manager.findOne(TenantSchedulingSettingsEntity, {
        where: { tenantId },
      });
      const slotDuration = settings?.slotDurationMinutes || 60;
      if (dto.durationMinutes % slotDuration !== 0) {
        throw new BadRequestException(BOOKING_ERRORS.INVALID_DURATION);
      }

      // 2. Check for conflicts (availability + overlaps) with locking
      const conflict = await this.checkForConflicts(
        tenantId,
        {
          trainerId: dto.trainerId,
          bookingDate: dto.bookingDate,
          startTime: dto.startTime,
          endTime: dto.endTime,
          bookingType: dto.bookingType,
        },
        undefined,
        manager,
      );

      if (conflict) {
        throw new BadRequestException({
          ...BOOKING_ERRORS.CONFLICT,
          detail: conflict,
        });
      }

      // 3. Validate member PT sessions if PT_SESSION
      let ptPackageId = dto.ptPackageId;
      if (dto.bookingType === BookingType.PT_SESSION) {
        if (ptPackageId) {
          const pkg = await manager.findOne(PtPackageEntity, {
            where: { id: ptPackageId, tenantId, memberId: dto.memberId },
          });
          if (
            !pkg ||
            pkg.status !== PtPackageStatus.ACTIVE ||
            pkg.remainingSessions <= 0
          ) {
            throw new BadRequestException(BOOKING_ERRORS.INSUFFICIENT_SESSIONS);
          }
        } else {
          // Find oldest active package
          const pkg = await manager.findOne(PtPackageEntity, {
            where: {
              tenantId,
              memberId: dto.memberId,
              status: PtPackageStatus.ACTIVE,
              remainingSessions: MoreThanOrEqual(1),
            },
            order: { createdAt: 'ASC' },
          });
          if (!pkg) {
            throw new BadRequestException(BOOKING_ERRORS.INSUFFICIENT_SESSIONS);
          }
          ptPackageId = pkg.id;
        }
      }

      // 4. Validate member Group sessions if GROUP_SESSION
      let groupSessionId = dto.groupSessionId;
      if (dto.bookingType === BookingType.GROUP_SESSION) {
        if (groupSessionId) {
          const session = await manager.findOne(GroupSessionEntity, {
            where: { id: groupSessionId, tenantId },
          });
          if (
            !session ||
            session.status !== GroupSessionStatus.ACTIVE ||
            session.remainingSessions <= 0
          ) {
            throw new BadRequestException('Insufficient group sessions');
          }
        } else {
          // Find oldest active session where member is purchaser or participant
          const qb = manager.createQueryBuilder(GroupSessionEntity, 'session');
          qb.leftJoin('session.participants', 'participant')
            .where('session.tenantId = :tenantId', { tenantId })
            .andWhere('session.status = :status', {
              status: GroupSessionStatus.ACTIVE,
            })
            .andWhere('session.remainingSessions >= 1')
            .andWhere(
              '(session.purchaserMemberId = :memberId OR (participant.memberId = :memberId AND participant.isActive = true))',
              { memberId: dto.memberId },
            )
            .orderBy('session.createdAt', 'ASC');

          const session = await qb.getOne();
          if (!session) {
            throw new BadRequestException('Insufficient group sessions');
          }
          groupSessionId = session.id;
        }
      }

      const booking = this.bookingRepo.create({
        ...dto,
        tenantId,
        ptPackageId,
        groupSessionId,
      });

      const saved = await manager.save(ScheduleBookingEntity, booking);
      return await this.findOne(tenantId, saved.id, manager);
    });
  }

  async findAll(tenantId: string, query: QueryBookingDto) {
    const {
      trainerId,
      memberId,
      date,
      dateFrom,
      dateTo,
      status,
      type,
      page = '1',
      limit = '10',
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: FindOptionsWhere<ScheduleBookingEntity> = { tenantId };
    if (trainerId) where.trainerId = trainerId;
    if (memberId) where.memberId = memberId;
    if (status) where.status = status;
    if (type) where.bookingType = type;
    if (date) where.bookingDate = date;
    else if (dateFrom && dateTo) {
      where.bookingDate = Between(dateFrom, dateTo);
    }

    const [items, total] = await this.bookingRepo.findAndCount({
      where,
      relations: [
        'member',
        'member.person',
        'trainer',
        'ptPackage',
        'groupSession',
      ],
      order: { bookingDate: 'DESC', startTime: 'ASC' },
      skip,
      take: parseInt(limit),
    });

    return { items, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async findOne(tenantId: string, id: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(ScheduleBookingEntity)
      : this.bookingRepo;
    const booking = await repo.findOne({
      where: { id, tenantId },
      relations: [
        'member',
        'member.person',
        'trainer',
        'ptPackage',
        'groupSession',
      ],
    });
    if (!booking) throw new NotFoundException(BOOKING_ERRORS.NOT_FOUND);
    return booking;
  }

  async update(tenantId: string, id: string, dto: UpdateBookingDto) {
    return await this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(ScheduleBookingEntity, {
        where: { id, tenantId },
      });
      if (!booking) throw new NotFoundException(BOOKING_ERRORS.NOT_FOUND);

      if (dto.bookingDate || dto.startTime || dto.endTime) {
        // Re-validate availability and conflicts with locking
        const conflict = await this.checkForConflicts(
          tenantId,
          {
            trainerId: booking.trainerId, // Trainer cannot be changed in update currently, if so need dto.trainerId
            bookingDate: dto.bookingDate || booking.bookingDate,
            startTime: dto.startTime || booking.startTime,
            endTime: dto.endTime || booking.endTime,
            bookingType: booking.bookingType,
          },
          id, // Exclude self
          manager,
        );

        if (conflict) {
          throw new BadRequestException({
            ...BOOKING_ERRORS.CONFLICT,
            detail: conflict,
          });
        }
      }

      Object.assign(booking, dto);
      return await manager.save(ScheduleBookingEntity, booking);
    });
  }

  async complete(tenantId: string, id: string) {
    const booking = await this.findOne(tenantId, id);
    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled bookings can be completed');
    }

    if (booking.bookingType === BookingType.PT_SESSION && booking.ptPackageId) {
      await this.deductSession(tenantId, booking.ptPackageId);
    } else if (
      booking.bookingType === BookingType.GROUP_SESSION &&
      booking.groupSessionId
    ) {
      await this.deductGroupSession(tenantId, booking.groupSessionId);
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    return await this.bookingRepo.save(booking);
  }

  async cancel(tenantId: string, id: string, reason?: string) {
    const booking = await this.findOne(tenantId, id);
    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled bookings can be cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledReason = reason ?? null;
    return await this.bookingRepo.save(booking);
  }

  async noShow(tenantId: string, id: string) {
    const booking = await this.findOne(tenantId, id);
    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled bookings can be marked as no-show',
      );
    }

    if (booking.bookingType === BookingType.PT_SESSION && booking.ptPackageId) {
      await this.deductSession(tenantId, booking.ptPackageId);
    } else if (
      booking.bookingType === BookingType.GROUP_SESSION &&
      booking.groupSessionId
    ) {
      await this.deductGroupSession(tenantId, booking.groupSessionId);
    }

    booking.status = BookingStatus.NO_SHOW;
    return await this.bookingRepo.save(booking);
  }

  private async checkForConflicts(
    tenantId: string,
    dto: {
      trainerId: string;
      bookingDate: string | Date;
      startTime: string;
      endTime: string;
      bookingType: BookingType;
    },
    excludeBookingId?: string,
    manager?: EntityManager,
  ): Promise<ConflictDetail | null> {
    const date = new Date(dto.bookingDate);
    const dayOfWeek = date.getUTCDay();
    const bookingDateStr =
      dto.bookingDate instanceof Date
        ? dto.bookingDate.toISOString().split('T')[0]
        : dto.bookingDate;

    // Use provided manager or default repositories
    const overrideRepo = manager
      ? manager.getRepository(TrainerAvailabilityOverrideEntity)
      : this.overrideRepo;
    const availabilityRepo = manager
      ? manager.getRepository(TrainerAvailabilityEntity)
      : this.availabilityRepo;
    const bookingRepo = manager
      ? manager.getRepository(ScheduleBookingEntity)
      : this.bookingRepo;

    // 1. Check Overrides (BLOCKED/MODIFIED)
    const overrides = await overrideRepo.find({
      where: {
        tenantId,
        trainerId: dto.trainerId,
        date: bookingDateStr,
      },
    });

    const blocked = overrides.find(
      (o) =>
        o.overrideType === OverrideType.BLOCKED &&
        (!o.startTime ||
          this.isOverlapping(
            dto.startTime,
            dto.endTime,
            o.startTime,
            o.endTime!,
          )),
    );
    if (blocked) {
      return {
        type: ConflictType.BLOCKED_OVERRIDE,
        message: 'Trainer has blocked time during this slot',
        conflictingTimeSlot: blocked.startTime
          ? { startTime: blocked.startTime, endTime: blocked.endTime! }
          : undefined,
      };
    }

    // 2. Check Availability (Template + Modified Overrides)
    const modified = overrides.filter(
      (o) => o.overrideType === OverrideType.MODIFIED,
    );
    let isAvailable = false;

    const normalizeTime = (t: string) => t.substring(0, 5);
    const start = normalizeTime(dto.startTime);
    const end = normalizeTime(dto.endTime);

    if (modified.length > 0) {
      isAvailable = modified.some(
        (o) =>
          normalizeTime(o.startTime!) <= start &&
          normalizeTime(o.endTime!) >= end,
      );
    } else {
      const template = await availabilityRepo.find({
        where: {
          tenantId,
          trainerId: dto.trainerId,
          dayOfWeek,
          isActive: true,
        },
      });

      const normalizeTime = (t: string) => t.substring(0, 5);
      const start = normalizeTime(dto.startTime);
      const end = normalizeTime(dto.endTime);

      isAvailable = template.some(
        (t) =>
          normalizeTime(t.startTime) <= start &&
          normalizeTime(t.endTime) >= end,
      );
    }

    if (!isAvailable) {
      return {
        type: ConflictType.OUTSIDE_AVAILABILITY,
        message: 'Booking time is outside trainer working hours',
      };
    }

    // 3. Check Double Booking (pessimistic lock if manager provided)
    // We lock the range of bookings for this trainer on this day to prevent concurrent inserts
    const conflictQuery = bookingRepo
      .createQueryBuilder('booking')
      .where('booking.tenantId = :tenantId', { tenantId })
      .andWhere('booking.trainerId = :trainerId', { trainerId: dto.trainerId })
      .andWhere('booking.bookingDate = :bookingDate', {
        bookingDate: bookingDateStr,
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.SCHEDULED, BookingStatus.COMPLETED],
      })
      .andWhere('booking.startTime < :endTime', { endTime: dto.endTime })
      .andWhere('booking.endTime > :startTime', { startTime: dto.startTime });

    if (excludeBookingId) {
      conflictQuery.andWhere('booking.id != :excludeId', {
        excludeId: excludeBookingId,
      });
    }

    if (manager) {
      // Apply pessimistic lock to prevent race conditions
      // Note: 'pessimistic_write' locks the selected rows.
      // To strictly prevent inserts, we ideally need range locks or table locks, which are database specific.
      // In Postgres, 'pessimistic_write' (FOR UPDATE) on a SELECT of potentially conflicting rows
      // will block other transactions trying to update/delete those rows.
      // However, it doesn't block INSERTs of new non-conflicting rows, but it DOES block
      // INSERTs if they would match a predicate in serializable isolation, OR if we lock a parent resource.
      // A common simple approach is to lock the Trainer (PeopleEntity) row for the duration of the check.
      // But here, we'll rely on the fact that if there IS a conflict, we catch it.
      // If there IS NOT a conflict, we might have a race.
      // To fix the gap, we should lock the Trainer entity.
      await manager
        .createQueryBuilder()
        .select('p')
        .from('people', 'p')
        .where('p.id = :id', { id: dto.trainerId })
        .setLock('pessimistic_write')
        .getOne();
    }

    const conflicts = await conflictQuery.getMany();

    for (const conflict of conflicts) {
      // If BOTH the new booking and the existing conflict are GROUP_SESSION, we allow overlap.
      // This allows multiple members to join a group session at the same time for the same trainer.
      if (
        dto.bookingType === BookingType.GROUP_SESSION &&
        conflict.bookingType === BookingType.GROUP_SESSION
      ) {
        continue;
      }

      // If we reach here, it's either:
      // 1. New booking is PT_SESSION (no overlap allowed)
      // 2. New booking is GROUP_SESSION but it overlaps a PT_SESSION (no overlap allowed)
      // 3. New booking overlaps some other future type that doesn't allow overlap.

      return {
        type: ConflictType.TRAINER_DOUBLE_BOOKED,
        message: 'Trainer already has a booking at this time',
        conflictingBookingId: conflict.id,
        conflictingTimeSlot: {
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      };
    }

    return null;
  }

  private async deductSession(tenantId: string, ptPackageId: string) {
    const pkg = await this.ptPackageRepo.findOne({
      where: { id: ptPackageId, tenantId },
    });
    if (!pkg || pkg.remainingSessions <= 0) {
      throw new BadRequestException(BOOKING_ERRORS.INSUFFICIENT_SESSIONS);
    }

    pkg.usedSessions += 1;
    pkg.remainingSessions -= 1;
    if (pkg.remainingSessions === 0) {
      pkg.status = PtPackageStatus.EXHAUSTED;
    }
    await this.ptPackageRepo.save(pkg);
  }

  private isOverlapping(
    s1: string,
    e1: string,
    s2: string,
    e2: string,
  ): boolean {
    return s1 < e2 && s2 < e1;
  }

  private async deductGroupSession(tenantId: string, groupSessionId: string) {
    const session = await this.groupSessionRepo.findOne({
      where: { id: groupSessionId, tenantId },
    });
    if (!session || session.remainingSessions <= 0) {
      throw new BadRequestException('Insufficient group sessions');
    }

    session.usedSessions += 1;
    session.remainingSessions -= 1;
    if (session.remainingSessions === 0) {
      session.status = GroupSessionStatus.EXHAUSTED;
    }
    await this.groupSessionRepo.save(session);
  }

  async getCalendarData(tenantId: string, query: CalendarQueryDto) {
    const { dateFrom, dateTo, trainerIds } = query;
    const trainerIdList = trainerIds
      ? trainerIds.split(',').filter(Boolean)
      : [];

    // 1. Fetch bookings
    const bookingWhere: FindOptionsWhere<ScheduleBookingEntity> = {
      tenantId,
      bookingDate: Between(dateFrom, dateTo),
      status: In([BookingStatus.SCHEDULED, BookingStatus.COMPLETED]),
    };
    if (trainerIdList.length > 0) {
      bookingWhere.trainerId = In(trainerIdList);
    }

    const bookings = await this.bookingRepo.find({
      where: bookingWhere,
      relations: ['member', 'member.person', 'ptPackage'],
      order: { bookingDate: 'ASC', startTime: 'ASC' },
    });

    // 2. Fetch availability templates & overrides
    // If trainer list provided, filter. Else fetch all relevant.
    const commonWhere: FindOptionsWhere<TrainerAvailabilityEntity> = {
      tenantId,
    };
    if (trainerIdList.length > 0) {
      commonWhere.trainerId = In(trainerIdList);
    }

    const templates = await this.availabilityRepo.find({
      where: { ...commonWhere, isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    const overrides = await this.overrideRepo.find({
      where: {
        ...commonWhere,
        date: Between(dateFrom, dateTo),
      },
    });

    // 3. Identify all trainers involved (from templates or bookings)
    const involvedTrainerIds = new Set<string>();
    if (trainerIdList.length > 0) {
      trainerIdList.forEach((id) => involvedTrainerIds.add(id));
    } else {
      templates.forEach((t) => involvedTrainerIds.add(t.trainerId));
      bookings.forEach((b) => involvedTrainerIds.add(b.trainerId));
    }

    // 4. Compute slots
    const availability: Record<
      string,
      Record<string, { startTime: string; endTime: string }[]>
    > = {};

    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    for (const trainerId of involvedTrainerIds) {
      availability[trainerId] = {};
      const trainerTemplates = templates.filter(
        (t) => t.trainerId === trainerId,
      );
      const trainerOverrides = overrides.filter(
        (o) => o.trainerId === trainerId,
      );

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getUTCDay();

        // 4a. Base Template
        let slots = trainerTemplates
          .filter((t) => t.dayOfWeek === dayOfWeek)
          .map((t) => ({ startTime: t.startTime, endTime: t.endTime }));

        // 4b. Overrides
        const dayOverrides = trainerOverrides.filter((o) => o.date === dateStr);

        // Full day block?
        const fullBlock = dayOverrides.find(
          (o) => o.overrideType === OverrideType.BLOCKED && !o.startTime,
        );
        if (fullBlock) {
          availability[trainerId][dateStr] = [];
          continue;
        }

        // Modified overrides replace template?
        // Assumption: Modified overrides define the new working hours for the day.
        const modified = dayOverrides.filter(
          (o) => o.overrideType === OverrideType.MODIFIED,
        );
        if (modified.length > 0) {
          slots = modified.map((o) => ({
            startTime: o.startTime!,
            endTime: o.endTime!,
          }));
        }

        // Partial blocks
        const partialBlocks = dayOverrides.filter(
          (o) => o.overrideType === OverrideType.BLOCKED && o.startTime,
        );
        for (const block of partialBlocks) {
          slots = this.subtractWindow(slots, block.startTime!, block.endTime!);
        }

        availability[trainerId][dateStr] = slots;
      }
    }

    return {
      bookings,
      availability,
    };
  }

  private subtractWindow(
    windows: { startTime: string; endTime: string }[],
    blockStart: string,
    blockEnd: string,
  ) {
    const result: { startTime: string; endTime: string }[] = [];
    const normalizeTime = (t: string) => t.substring(0, 5);
    const bStart = normalizeTime(blockStart);
    const bEnd = normalizeTime(blockEnd);

    for (const window of windows) {
      const wStart = normalizeTime(window.startTime);
      const wEnd = normalizeTime(window.endTime);

      if (bEnd <= wStart || bStart >= wEnd) {
        result.push(window);
        continue;
      }

      if (bStart <= wStart && bEnd >= wEnd) {
        continue;
      }

      if (bStart > wStart && bEnd < wEnd) {
        result.push({ startTime: window.startTime, endTime: blockStart });
        result.push({ startTime: blockEnd, endTime: window.endTime });
        continue;
      }

      if (bStart <= wStart && bEnd < wEnd) {
        result.push({ startTime: blockEnd, endTime: window.endTime });
        continue;
      }

      if (bStart > wStart && bEnd >= wEnd) {
        result.push({ startTime: window.startTime, endTime: blockStart });
        continue;
      }
    }
    return result;
  }
}
