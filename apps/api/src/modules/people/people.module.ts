import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleEntity, UserEntity } from '../../database/entities';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { TenantCountersModule } from '../tenant-counters/tenant-counters.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PeopleEntity, UserEntity]),
    TenantCountersModule,
    TenantsModule,
    UsersModule,
  ],
  controllers: [PeopleController],
  providers: [PeopleService],
})
export class PeopleModule {}
