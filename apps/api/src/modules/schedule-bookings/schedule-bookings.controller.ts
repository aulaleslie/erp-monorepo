import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ScheduleBookingsService } from './schedule-bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('bookings')
export class ScheduleBookingsController {
  constructor(private readonly service: ScheduleBookingsService) {}

  @Post()
  @RequirePermissions('schedules.create')
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return await this.service.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions('schedules.read')
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: QueryBookingDto,
  ) {
    return await this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('schedules.read')
  async findOne(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.service.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('schedules.update')
  async update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return await this.service.update(tenantId, id, dto);
  }

  @Post(':id/complete')
  @RequirePermissions('schedules.update')
  async complete(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.service.complete(tenantId, id);
  }

  @Post(':id/cancel')
  @RequirePermissions('schedules.update')
  async cancel(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return await this.service.cancel(tenantId, id, reason);
  }

  @Post(':id/no-show')
  @RequirePermissions('schedules.update')
  async noShow(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return await this.service.noShow(tenantId, id);
  }
}
