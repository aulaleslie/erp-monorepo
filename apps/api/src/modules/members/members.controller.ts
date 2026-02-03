import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberQueryDto } from './dto/member-query.dto';
import { MemberLookupDto } from './dto/member-lookup.dto';

@ApiTags('members')
@ApiCookieAuth('access_token')
@Controller('members')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEMBERS.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: MemberQueryDto,
  ) {
    return this.membersService.findAll(tenantId, query);
  }

  @Get('lookup')
  @RequirePermissions(PERMISSIONS.MEMBERS.READ)
  async lookup(
    @CurrentTenant() tenantId: string,
    @Query() query: MemberLookupDto,
  ) {
    return this.membersService.lookup(tenantId, query.q);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEMBERS.READ)
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.membersService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEMBERS.CREATE)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.membersService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MEMBERS.UPDATE)
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.MEMBERS.DELETE)
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.membersService.remove(tenantId, id);
  }
}
