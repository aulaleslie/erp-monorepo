import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { ScheduleBookingsService } from './schedule-bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';

@Controller('bookings')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class ScheduleBookingsController {
  constructor(private readonly service: ScheduleBookingsService) {}

  @Get('calendar')
  @RequirePermissions(PERMISSIONS.SCHEDULES.READ)
  async getCalendar(
    @CurrentTenant('id') tenantId: string,
    @Query() query: CalendarQueryDto,
  ) {
    return await this.service.getCalendarData(tenantId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SCHEDULES.CREATE)
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return await this.service.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SCHEDULES.READ)
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: QueryBookingDto,
  ) {
    return await this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SCHEDULES.READ)
  async findOne(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.service.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.SCHEDULES.UPDATE)
  async update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return await this.service.update(tenantId, id, dto);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.SCHEDULES.UPDATE)
  async complete(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.service.complete(tenantId, id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.SCHEDULES.UPDATE)
  async cancel(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return await this.service.cancel(tenantId, id, reason);
  }

  @Post(':id/no-show')
  @RequirePermissions(PERMISSIONS.SCHEDULES.UPDATE)
  async noShow(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return await this.service.noShow(tenantId, id);
  }
}
