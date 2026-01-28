import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { GroupSessionsService } from './group-sessions.service';
import { CreateGroupSessionDto } from './dto/create-group-session.dto';
import { UpdateGroupSessionDto } from './dto/update-group-session.dto';
import { GroupSessionQueryDto } from './dto/group-session-query.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('group-sessions')
@ApiCookieAuth('access_token')
@Controller('group-sessions')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class GroupSessionsController {
  constructor(private readonly groupSessionsService: GroupSessionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.READ)
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: GroupSessionQueryDto,
  ) {
    return this.groupSessionsService.findAll(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.READ)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.groupSessionsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.CREATE)
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateGroupSessionDto,
  ) {
    return this.groupSessionsService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.UPDATE)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGroupSessionDto,
  ) {
    return this.groupSessionsService.update(tenantId, id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.CANCEL)
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.groupSessionsService.cancel(tenantId, id);
  }

  @Get(':id/participants')
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.READ)
  getParticipants(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.groupSessionsService.getParticipants(tenantId, id);
  }

  @Post(':id/participants')
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.MANAGE_PARTICIPANTS)
  addParticipant(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.groupSessionsService.addParticipant(tenantId, id, dto);
  }

  @Delete(':id/participants/:memberId')
  @RequirePermissions(PERMISSIONS.GROUP_SESSIONS.MANAGE_PARTICIPANTS)
  removeParticipant(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupSessionsService.removeParticipant(tenantId, id, memberId);
  }
}
