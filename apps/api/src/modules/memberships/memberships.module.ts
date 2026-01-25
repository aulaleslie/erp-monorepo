import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipEntity } from '../../database/entities/membership.entity';
import { MembershipHistoryEntity } from '../../database/entities/membership-history.entity';
import { MembershipsService } from './memberships.service';
import { MembershipHistoryService } from './membership-history.service';
import { MembershipsIntegrationService } from './memberships-integration.service';
import { MembersModule } from '../members/members.module';
import { ItemsModule } from '../catalog/items/items.module';

import { MembershipsController } from './memberships.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipEntity, MembershipHistoryEntity]),
    MembersModule,
    ItemsModule,
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
