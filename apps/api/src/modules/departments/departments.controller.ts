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
import { PERMISSIONS } from '@gym-monorepo/shared';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';

@ApiTags('departments')
@ApiCookieAuth('access_token')
@Controller('departments')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DEPARTMENTS.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: DepartmentQueryDto,
  ) {
    return this.departmentsService.findAll(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DEPARTMENTS.READ)
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.departmentsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DEPARTMENTS.CREATE)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.DEPARTMENTS.UPDATE)
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.DEPARTMENTS.DELETE)
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.departmentsService.remove(tenantId, id);
  }
}
