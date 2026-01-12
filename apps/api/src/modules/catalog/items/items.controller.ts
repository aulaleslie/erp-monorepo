import {
  BadRequestException,
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiConsumes, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { PERMISSIONS } from '@gym-monorepo/shared';

import { ActiveTenantGuard } from '../../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { ItemsService } from './items.service';
import { ItemsImportService } from './items-import.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemQueryDto } from './dto/item-query.dto';

@ApiTags('catalog/items')
@ApiCookieAuth('access_token')
@Controller('catalog/items')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly itemsImportService: ItemsImportService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ITEMS.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ItemQueryDto,
  ) {
    return this.itemsService.findAll(query, tenantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ITEMS.READ)
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.itemsService.findOne(id, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ITEMS.CREATE)
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreateItemDto) {
    return this.itemsService.create(dto, tenantId);
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @RequirePermissions(PERMISSIONS.ITEMS.CREATE)
  async importItems(
    @CurrentTenant() tenantId: string,
    @Req() request: FastifyRequest,
  ) {
    const data = await request.file();

    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await data.toBuffer();
    const file = {
      buffer,
      mimetype: data.mimetype,
      filename: data.filename,
    };

    return this.itemsImportService.importItems(tenantId, file);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ITEMS.UPDATE)
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.ITEMS.DELETE)
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.itemsService.remove(id, tenantId);
  }

  @Post(':id/image')
  @ApiConsumes('multipart/form-data')
  @RequirePermissions(PERMISSIONS.ITEMS.UPDATE)
  async uploadImage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Req() request: FastifyRequest,
  ) {
    const data = await request.file();

    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await data.toBuffer();
    const file = {
      buffer,
      mimetype: data.mimetype,
      filename: data.filename,
      size: buffer.length,
    };

    return this.itemsService.uploadImage(id, tenantId, file);
  }
}
