import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { PtSessionPackagesService } from './pt-session-packages.service';

import { PtSessionPackagesController } from './pt-session-packages.controller';

import { MembersModule } from '../members/members.module';
import { ItemsModule } from '../catalog/items/items.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { PeopleModule } from '../people/people.module';

import { PtSessionPackagesIntegrationService } from './pt-session-packages-integration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PtPackageEntity]),
    MembersModule,
    ItemsModule,
    TenantsModule,
    UsersModule,
    PeopleModule,
  ],
  controllers: [PtSessionPackagesController],
  providers: [PtSessionPackagesService, PtSessionPackagesIntegrationService],
  exports: [PtSessionPackagesService, PtSessionPackagesIntegrationService],
})
export class PtSessionPackagesModule {}
