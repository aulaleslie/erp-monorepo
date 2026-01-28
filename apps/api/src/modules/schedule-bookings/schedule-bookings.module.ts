import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleBookingsService } from './schedule-bookings.service';
import { ScheduleBookingsController } from './schedule-bookings.controller';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { TenantSchedulingSettingsEntity } from '../../database/entities/tenant-scheduling-settings.entity';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleBookingEntity,
      TrainerAvailabilityEntity,
      TrainerAvailabilityOverrideEntity,
      PtPackageEntity,
      TenantSchedulingSettingsEntity,
      GroupSessionEntity,
    ]),
    UsersModule,
    TenantsModule,
  ],
  controllers: [ScheduleBookingsController],
  providers: [ScheduleBookingsService],
  exports: [ScheduleBookingsService],
})
export class ScheduleBookingsModule {}
