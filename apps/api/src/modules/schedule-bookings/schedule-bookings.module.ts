import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleBookingsService } from './schedule-bookings.service';
import { ScheduleBookingsController } from './schedule-bookings.controller';
import { ScheduleBookingEntity } from '../../database/entities/schedule-booking.entity';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { TenantSchedulingSettingsEntity } from '../../database/entities/tenant-scheduling-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleBookingEntity,
      TrainerAvailabilityEntity,
      TrainerAvailabilityOverrideEntity,
      PtPackageEntity,
      TenantSchedulingSettingsEntity,
    ]),
  ],
  controllers: [ScheduleBookingsController],
  providers: [ScheduleBookingsService],
  exports: [ScheduleBookingsService],
})
export class ScheduleBookingsModule {}
