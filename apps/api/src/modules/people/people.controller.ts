import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { PeopleService } from './people.service';
import { CreatePeopleDto } from './dto/create-people.dto';
import { UpdatePeopleDto } from './dto/update-people.dto';
import { PeopleQueryDto } from './dto/people-query.dto';
import { InvitablePeopleQueryDto } from './dto/invitable-people-query.dto';
import { InvitePeopleDto } from './dto/invite-people.dto';
import { InvitableUsersQueryDto } from './dto/invitable-users-query.dto';
import { LinkUserDto } from './dto/link-user.dto';

@ApiTags('people')
@ApiCookieAuth('access_token')
@Controller('people')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  @RequirePermissions('people.read')
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: PeopleQueryDto,
  ) {
    return this.peopleService.findAll(tenantId, query);
  }

  @Get('invitable')
  @RequirePermissions('people.create')
  async getInvitable(
    @CurrentTenant() tenantId: string,
    @Query() query: InvitablePeopleQueryDto,
  ) {
    return this.peopleService.searchInvitablePeople(tenantId, query);
  }

  @Get('staff/invitable-users')
  @RequirePermissions('people.update')
  async getInvitableUsersForStaff(@Query() query: InvitableUsersQueryDto) {
    return this.peopleService.searchInvitableUsersForStaff(query);
  }

  @Get(':id')
  @RequirePermissions('people.read')
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.peopleService.findOne(tenantId, id);
  }

  @Post('invite')
  @RequirePermissions('people.create')
  async invite(
    @CurrentTenant() tenantId: string,
    @Body() dto: InvitePeopleDto,
  ) {
    return this.peopleService.inviteExisting(tenantId, dto);
  }

  @Post()
  @RequirePermissions('people.create')
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePeopleDto,
  ) {
    return this.peopleService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('people.update')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePeopleDto,
  ) {
    return this.peopleService.update(tenantId, id, dto);
  }

  @Put(':id/link-user')
  @RequirePermissions('people.update')
  async linkUser(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: LinkUserDto,
  ) {
    return this.peopleService.linkUser(tenantId, id, dto);
  }

  @Put(':id/unlink-user')
  @RequirePermissions('people.update')
  async unlinkUser(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.peopleService.unlinkUser(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('people.delete')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.peopleService.remove(tenantId, id);
  }
}
