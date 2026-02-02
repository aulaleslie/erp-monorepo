import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecordEntity } from '../../database/entities/attendance-record.entity';
import { MemberEntity } from '../../database/entities/member.entity';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceRecordEntity,
      MemberEntity,
      ScheduleBookingEntity,
      PtPackageEntity,
      GroupSessionEntity,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
