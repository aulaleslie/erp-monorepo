import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { TagsService } from './tags.service';
import { TagAssignmentDto } from './dto/tag-assignment.dto';
import { TagListQueryDto } from './dto/tag-list-query.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('tags')
@ApiCookieAuth('access_token')
@Controller('tags')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('manage')
  @RequirePermissions('tags.manage')
  async list(
    @CurrentTenant() tenantId: string,
    @Query() query: TagListQueryDto,
  ) {
    return this.tagsService.list(tenantId, query);
  }

  @Patch(':tagId')
  @RequirePermissions('tags.manage')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('tagId') tagId: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagsService.update(tenantId, tagId, dto);
  }

  @Get()
  @RequirePermissions('tags.assign')
  async suggest(
    @CurrentTenant() tenantId: string,
    @Query('query') query?: string,
  ) {
    return this.tagsService.suggest(tenantId, query);
  }

  @Post('assign')
  @RequirePermissions('tags.assign')
  async assignTags(
    @CurrentTenant() tenantId: string,
    @Body() dto: TagAssignmentDto,
  ) {
    return this.tagsService.assign(tenantId, dto);
  }

  @Delete('assign')
  @RequirePermissions('tags.assign')
  async removeTags(
    @CurrentTenant() tenantId: string,
    @Body() dto: TagAssignmentDto,
  ) {
    return this.tagsService.remove(tenantId, dto);
  }
}
