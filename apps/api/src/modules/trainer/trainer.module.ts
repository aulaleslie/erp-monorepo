import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { TrainerAvailabilityService } from './trainer-availability.service';
import { TrainerAvailabilityController } from './trainer-availability.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainerAvailabilityEntity,
      TrainerAvailabilityOverrideEntity,
    ]),
    UsersModule,
    TenantsModule,
  ],
  providers: [TrainerAvailabilityService],
  controllers: [TrainerAvailabilityController],
  exports: [TrainerAvailabilityService],
})
export class TrainerModule {}
