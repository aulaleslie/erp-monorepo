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

  @Get(':id')
  @RequirePermissions('people.read')
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.peopleService.findOne(tenantId, id);
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('people.delete')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.peopleService.remove(tenantId, id);
  }
}
