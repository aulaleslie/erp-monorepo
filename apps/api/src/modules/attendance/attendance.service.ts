import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import {
  AttendanceType,
  BookingStatus,
  BookingType,
  PtPackageStatus,
  GroupSessionStatus,
} from '@gym-monorepo/shared';
import { AttendanceRecordEntity } from '../../database/entities/attendance-record.entity';
import { MemberEntity } from '../../database/entities/member.entity';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { CheckInDto } from './dto/check-in.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { DataSource, EntityManager } from 'typeorm';
import { format } from 'date-fns';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepo: Repository<AttendanceRecordEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(ScheduleBookingEntity)
    private readonly bookingRepo: Repository<ScheduleBookingEntity>,
    @InjectRepository(PtPackageEntity)
    private readonly ptPackageRepo: Repository<PtPackageEntity>,
    @InjectRepository(GroupSessionEntity)
    private readonly groupSessionRepo: Repository<GroupSessionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async checkIn(tenantId: string, userId: string, dto: CheckInDto) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Lookup member
      const member = await this.lookupMember(tenantId, dto);
      if (!member) {
        throw new NotFoundException('Member not found');
      }

      // 2. Validate membership expiry
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!member.currentExpiryDate) {
        throw new BadRequestException('Member has no active membership');
      }
      const expiryDate = new Date(member.currentExpiryDate);
      if (expiryDate < today) {
        throw new BadRequestException({
          message: 'Membership has expired',
          expiryDate: member.currentExpiryDate,
        });
      }

      // 3. Handle specific attendance types
      let bookingId = dto.bookingId;
      if (
        dto.attendanceType === AttendanceType.PT_SESSION ||
        dto.attendanceType === AttendanceType.GROUP_CLASS
      ) {
        const booking = await this.validateAndCompleteBooking(
          tenantId,
          member.id,
          dto,
          manager,
        );
        bookingId = booking.id;
      }

      // 4. Create attendance record
      const attendance = this.attendanceRepo.create({
        tenantId,
        memberId: member.id,
        attendanceType: dto.attendanceType,
        bookingId,
        checkInAt: new Date(),
        checkInMethod: dto.checkInMethod,
        checkedInByUserId: userId,
        notes: dto.notes,
      });

      return await manager.save(AttendanceRecordEntity, attendance);
    });
  }

  async checkOut(tenantId: string, id: string) {
    const record = await this.attendanceRepo.findOne({
      where: { id, tenantId, checkOutAt: IsNull() },
    });
    if (!record) {
      throw new NotFoundException('Open attendance record not found');
    }

    record.checkOutAt = new Date();
    return await this.attendanceRepo.save(record);
  }

  async findAll(tenantId: string, query: AttendanceQueryDto) {
    const { memberId, dateFrom, dateTo, type, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: {
      tenantId: string;
      memberId?: string;
      attendanceType?: AttendanceType;
      checkInAt?: any;
    } = { tenantId };
    if (memberId) where.memberId = memberId;
    if (type) where.attendanceType = type;
    if (dateFrom && dateTo) {
      where.checkInAt = Between(new Date(dateFrom), new Date(dateTo));
    }

    const [items, total] = await this.attendanceRepo.findAndCount({
      where,
      relations: ['member', 'member.person', 'booking'],
      order: { checkInAt: 'DESC' },
      skip,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async getTodayCheckIns(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.attendanceRepo.find({
      where: {
        tenantId,
        checkInAt: Between(today, tomorrow),
      },
      relations: ['member', 'member.person'],
      order: { checkInAt: 'DESC' },
    });
  }

  private async lookupMember(tenantId: string, dto: CheckInDto) {
    if (dto.memberId) {
      return await this.memberRepo.findOne({
        where: { id: dto.memberId, tenantId },
      });
    }

    const qb = this.memberRepo.createQueryBuilder('member');
    qb.leftJoinAndSelect('member.person', 'person');
    qb.where('member.tenantId = :tenantId', { tenantId });

    if (dto.memberCode) {
      qb.andWhere('member.memberCode = :code', { code: dto.memberCode });
    } else if (dto.memberPhone) {
      qb.andWhere('person.phone = :phone', { phone: dto.memberPhone });
    } else {
      return null;
    }

    return await qb.getOne();
  }

  private async validateAndCompleteBooking(
    tenantId: string,
    memberId: string,
    dto: CheckInDto,
    manager: EntityManager,
  ) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const bookingRepo = manager.getRepository(ScheduleBookingEntity);

    let booking: ScheduleBookingEntity | null;

    if (dto.bookingId) {
      booking = await bookingRepo.findOne({
        where: { id: dto.bookingId, tenantId, memberId },
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (format(new Date(booking.bookingDate), 'yyyy-MM-dd') !== todayStr) {
        throw new BadRequestException('Booking is not for today');
      }
    } else {
      // Find today's booking for this member
      booking = await bookingRepo.findOne({
        where: {
          tenantId,
          memberId,
          bookingDate: todayStr,
          status: BookingStatus.SCHEDULED,
        },
        order: { startTime: 'ASC' },
      });
      if (!booking) {
        throw new BadRequestException('No scheduled booking found for today');
      }
    }

    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException(
        'Booking is already processed or cancelled',
      );
    }

    // Deduct session
    if (booking.bookingType === BookingType.PT_SESSION && booking.ptPackageId) {
      await this.deductPtSession(tenantId, booking.ptPackageId, manager);
    } else if (
      booking.bookingType === BookingType.GROUP_SESSION &&
      booking.groupSessionId
    ) {
      await this.deductGroupSession(tenantId, booking.groupSessionId, manager);
    }

    // Complete booking
    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    await manager.save(ScheduleBookingEntity, booking);

    return booking;
  }

  private async deductPtSession(
    tenantId: string,
    pkgId: string,
    manager: EntityManager,
  ) {
    const pkgRepo = manager.getRepository(PtPackageEntity);
    const pkg = await pkgRepo.findOne({ where: { id: pkgId, tenantId } });
    if (!pkg || pkg.remainingSessions <= 0) {
      throw new BadRequestException('Insufficient PT sessions');
    }

    pkg.usedSessions += 1;
    pkg.remainingSessions -= 1;
    if (pkg.remainingSessions === 0) {
      pkg.status = PtPackageStatus.EXHAUSTED;
    }
    await manager.save(PtPackageEntity, pkg);
  }

  private async deductGroupSession(
    tenantId: string,
    sessionId: string,
    manager: EntityManager,
  ) {
    const sessionRepo = manager.getRepository(GroupSessionEntity);
    const session = await sessionRepo.findOne({
      where: { id: sessionId, tenantId },
    });
    if (!session || session.remainingSessions <= 0) {
      throw new BadRequestException('Insufficient group sessions');
    }

    session.usedSessions += 1;
    session.remainingSessions -= 1;
    if (session.remainingSessions === 0) {
      session.status = GroupSessionStatus.EXHAUSTED;
    }
    await manager.save(GroupSessionEntity, session);
  }
}
