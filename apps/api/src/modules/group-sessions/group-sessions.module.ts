import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { GroupSessionParticipantEntity } from '../../database/entities/group-session-participant.entity';
import { GroupSessionsService } from './group-sessions.service';
import { GroupSessionsIntegrationService } from './group-sessions-integration.service';
import { GroupSessionsController } from './group-sessions.controller';
import { MembersModule } from '../members/members.module';
import { CatalogModule } from '../catalog/catalog.module';
import { PeopleModule } from '../people/people.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupSessionEntity,
      GroupSessionParticipantEntity,
    ]),
    MembersModule,
    CatalogModule,
    PeopleModule,
    TenantsModule,
  ],
  providers: [GroupSessionsService, GroupSessionsIntegrationService],
  controllers: [GroupSessionsController],
  exports: [GroupSessionsService, GroupSessionsIntegrationService],
})
export class GroupSessionsModule {}
