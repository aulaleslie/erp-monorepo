import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PeopleEntity,
  UserEntity,
  TenantUserEntity,
  RoleEntity,
} from '../../database/entities';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { TenantCountersModule } from '../tenant-counters/tenant-counters.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PeopleEntity,
      UserEntity,
      TenantUserEntity,
      RoleEntity,
    ]),
    TenantCountersModule,
    TenantsModule,
    UsersModule,
    TagsModule,
  ],
  controllers: [PeopleController],
  providers: [PeopleService],
})
export class PeopleModule {}
