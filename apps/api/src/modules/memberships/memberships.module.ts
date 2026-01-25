import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipEntity } from '../../database/entities/membership.entity';
import { MembershipHistoryEntity } from '../../database/entities/membership-history.entity';
import { MembershipsService } from './memberships.service';
import { MembershipHistoryService } from './membership-history.service';
import { MembershipsIntegrationService } from './memberships-integration.service';
import { MembersModule } from '../members/members.module';
import { ItemsModule } from '../catalog/items/items.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { PtSessionPackagesModule } from '../pt-session-packages/pt-session-packages.module';

import { MembershipsController } from './memberships.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipEntity, MembershipHistoryEntity]),
    MembersModule,
    ItemsModule,
    TenantsModule,
    UsersModule,
    forwardRef(() => PtSessionPackagesModule),
  ],
  controllers: [MembershipsController],
  providers: [
    MembershipsService,
    MembershipHistoryService,
    MembershipsIntegrationService,
  ],
  exports: [
    MembershipsService,
    MembershipHistoryService,
    MembershipsIntegrationService,
  ],
})
export class MembershipsModule {}
