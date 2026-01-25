import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipEntity } from '../../database/entities/membership.entity';
import { MembershipsService } from './memberships.service';
import { MembersModule } from '../members/members.module';
import { ItemsModule } from '../catalog/items/items.module';

import { MembershipsController } from './memberships.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipEntity]),
    MembersModule,
    ItemsModule,
  ],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
