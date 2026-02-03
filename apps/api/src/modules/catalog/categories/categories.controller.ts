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
import { PERMISSIONS } from '@gym-monorepo/shared';

import { ActiveTenantGuard } from '../../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';

@ApiTags('catalog/categories')
@ApiCookieAuth('access_token')
@Controller('catalog/categories')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CATEGORIES.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: CategoryQueryDto,
  ) {
    return this.categoriesService.findAll(query, tenantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES.READ)
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.categoriesService.findOne(id, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CATEGORIES.CREATE)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(dto, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES.UPDATE)
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.CATEGORIES.DELETE)
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.categoriesService.remove(id, tenantId);
  }
}
