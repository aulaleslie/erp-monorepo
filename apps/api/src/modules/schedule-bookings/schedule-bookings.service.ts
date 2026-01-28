import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  In,
  Not,
  FindOptionsWhere,
} from 'typeorm';
import {
  BookingStatus,
  BookingType,
  BOOKING_ERRORS,
  PtPackageStatus,
  OverrideType,
} from '@gym-monorepo/shared';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { TenantSchedulingSettingsEntity } from '../../database/entities/tenant-scheduling-settings.entity';

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
    @InjectRepository(TenantSchedulingSettingsEntity)
    private readonly settingsRepo: Repository<TenantSchedulingSettingsEntity>,
  ) {}

  async create(tenantId: string, dto: CreateBookingDto) {
    // 1. Validate slot duration
    const settings = await this.settingsRepo.findOne({ where: { tenantId } });
    const slotDuration = settings?.slotDurationMinutes || 60;
    if (dto.durationMinutes % slotDuration !== 0) {
      throw new BadRequestException(BOOKING_ERRORS.INVALID_DURATION);
    }

    // 2. Validate trainer availability
    await this.validateTrainerAvailability(tenantId, dto);

    // 3. Check for conflicts
    const conflict = await this.bookingRepo.findOne({
      where: {
        tenantId,
        trainerId: dto.trainerId,
        bookingDate: dto.bookingDate,
        status: In([BookingStatus.SCHEDULED, BookingStatus.COMPLETED]),
        startTime: LessThanOrEqual(dto.endTime),
        endTime: MoreThanOrEqual(dto.startTime),
      },
    });

    if (conflict) {
      // Deep overlap check
      if (
        this.isOverlapping(
          dto.startTime,
          dto.endTime,
          conflict.startTime,
          conflict.endTime,
        )
      ) {
        throw new BadRequestException(BOOKING_ERRORS.CONFLICT);
      }
    }

    // 4. Validate member PT sessions if PT_SESSION
    let ptPackageId = dto.ptPackageId;
    if (dto.bookingType === BookingType.PT_SESSION) {
      if (ptPackageId) {
        const pkg = await this.ptPackageRepo.findOne({
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
        const pkg = await this.ptPackageRepo.findOne({
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

    const booking = this.bookingRepo.create({
      ...dto,
      tenantId,
      ptPackageId,
    });

    return await this.bookingRepo.save(booking);
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

    const where: Record<string, any> = { tenantId };
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
      relations: ['member', 'trainer', 'ptPackage'],
      order: { bookingDate: 'DESC', startTime: 'ASC' },
      skip,
      take: parseInt(limit),
    });

    return { items, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async findOne(tenantId: string, id: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id, tenantId },
      relations: ['member', 'trainer', 'ptPackage'],
    });
    if (!booking) throw new NotFoundException(BOOKING_ERRORS.NOT_FOUND);
    return booking;
  }

  async update(tenantId: string, id: string, dto: UpdateBookingDto) {
    const booking = await this.findOne(tenantId, id);

    if (dto.bookingDate || dto.startTime || dto.endTime) {
      // Re-validate availability and conflicts if time changed
      await this.validateTrainerAvailability(tenantId, {
        trainerId: booking.trainerId,
        bookingDate: dto.bookingDate || booking.bookingDate,
        startTime: dto.startTime || booking.startTime,
        endTime: dto.endTime || booking.endTime,
      });

      const conflict = await this.bookingRepo.findOne({
        where: {
          tenantId,
          id: Not(id),
          trainerId: booking.trainerId,
          bookingDate: dto.bookingDate || booking.bookingDate,
          status: In([BookingStatus.SCHEDULED, BookingStatus.COMPLETED]),
          startTime: LessThanOrEqual(dto.endTime || booking.endTime),
          endTime: MoreThanOrEqual(dto.startTime || booking.startTime),
        },
      });

      if (
        conflict &&
        this.isOverlapping(
          dto.startTime || booking.startTime,
          dto.endTime || booking.endTime,
          conflict.startTime,
          conflict.endTime,
        )
      ) {
        throw new BadRequestException(BOOKING_ERRORS.CONFLICT);
      }
    }

    Object.assign(booking, dto);
    return await this.bookingRepo.save(booking);
  }

  async complete(tenantId: string, id: string) {
    const booking = await this.findOne(tenantId, id);
    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled bookings can be completed');
    }

    if (booking.bookingType === BookingType.PT_SESSION && booking.ptPackageId) {
      await this.deductSession(tenantId, booking.ptPackageId);
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
    }

    booking.status = BookingStatus.NO_SHOW;
    return await this.bookingRepo.save(booking);
  }

  private async validateTrainerAvailability(
    tenantId: string,
    dto: {
      trainerId: string;
      bookingDate: string | Date;
      startTime: string;
      endTime: string;
    },
  ) {
    const date = new Date(dto.bookingDate);
    const dayOfWeek = date.getUTCDay();

    // Check overrides
    const overrides = await this.overrideRepo.find({
      where: {
        tenantId,
        trainerId: dto.trainerId,
        date: dto.bookingDate as string,
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
    if (blocked)
      throw new BadRequestException(BOOKING_ERRORS.TRAINER_UNAVAILABLE);

    const modified = overrides.filter(
      (o) => o.overrideType === OverrideType.MODIFIED,
    );
    if (modified.length > 0) {
      const isAvailable = modified.some(
        (o) => o.startTime! <= dto.startTime && o.endTime! >= dto.endTime,
      );
      if (!isAvailable)
        throw new BadRequestException(BOOKING_ERRORS.TRAINER_UNAVAILABLE);
      return; // Modified override takes precedence over template
    }

    // Check template
    const template = await this.availabilityRepo.find({
      where: { tenantId, trainerId: dto.trainerId, dayOfWeek, isActive: true },
    });

    const isAvailableInTemplate = template.some(
      (t) => t.startTime <= dto.startTime && t.endTime >= dto.endTime,
    );
    if (!isAvailableInTemplate) {
      throw new BadRequestException(BOOKING_ERRORS.TRAINER_UNAVAILABLE);
    }
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
      relations: ['member', 'ptPackage'],
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
        const dayOfWeek = d.getDay();

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

    for (const window of windows) {
      if (blockEnd <= window.startTime || blockStart >= window.endTime) {
        result.push(window);
        continue;
      }

      if (blockStart <= window.startTime && blockEnd >= window.endTime) {
        continue;
      }

      if (blockStart > window.startTime && blockEnd < window.endTime) {
        result.push({ startTime: window.startTime, endTime: blockStart });
        result.push({ startTime: blockEnd, endTime: window.endTime });
        continue;
      }

      if (blockStart <= window.startTime && blockEnd < window.endTime) {
        result.push({ startTime: blockEnd, endTime: window.endTime });
        continue;
      }

      if (blockStart > window.startTime && blockEnd >= window.endTime) {
        result.push({ startTime: window.startTime, endTime: blockStart });
        continue;
      }
    }
    return result;
  }
}
