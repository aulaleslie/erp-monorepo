import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecordEntity } from '../../database/entities/attendance-record.entity';
import { MemberEntity } from '../../database/entities/member.entity';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { UsersModule } from '../users/users.module';
import { PermissionGuard } from '../users/guards/permission.guard';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceRecordEntity,
      MemberEntity,
      ScheduleBookingEntity,
      PtPackageEntity,
      GroupSessionEntity,
    ]),
    TenantsModule,
    UsersModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, PermissionGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
