import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

@ApiTags('attendance')
@ApiCookieAuth('access_token')
@Controller('attendance')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @RequirePermissions(PERMISSIONS.ATTENDANCE.CREATE)
  async checkIn(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CheckInDto,
  ) {
    return this.attendanceService.checkIn(tenantId, userId, dto);
  }

  @Post('check-out/:id')
  @RequirePermissions(PERMISSIONS.ATTENDANCE.CREATE)
  async checkOut(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.attendanceService.checkOut(tenantId, id);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ATTENDANCE.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.findAll(tenantId, query);
  }

  @Get('today')
  @RequirePermissions(PERMISSIONS.ATTENDANCE.READ)
  async getTodayCheckIns(@CurrentTenant() tenantId: string) {
    return this.attendanceService.getTodayCheckIns(tenantId);
  }
}
