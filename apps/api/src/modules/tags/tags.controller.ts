import {
  Body,
  Controller,
  Delete,
  Get,
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
