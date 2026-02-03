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
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { TrainerAvailabilityService } from './trainer-availability.service';
import { UpdateTrainerAvailabilityDto } from './dto/update-trainer-availability.dto';
import { CreateTrainerAvailabilityOverrideDto } from './dto/create-trainer-availability-override.dto';
import { OverridesQueryDto } from './dto/overrides-query.dto';

@ApiTags('trainer-availability')
@ApiCookieAuth('access_token')
@Controller('trainer-availability')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class TrainerAvailabilityController {
  constructor(
    private readonly availabilityService: TrainerAvailabilityService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TRAINER_AVAILABILITY.READ)
  async getWeeklyTemplate(
    @CurrentTenant() tenantId: string,
    @Query('trainerId') trainerId: string,
  ) {
    return this.availabilityService.getWeeklyTemplate(tenantId, trainerId);
  }

  @Put(':trainerId')
  @RequirePermissions(PERMISSIONS.TRAINER_AVAILABILITY.UPDATE)
  async updateWeeklyTemplate(
    @CurrentTenant() tenantId: string,
    @Param('trainerId') trainerId: string,
    @Body() dtos: UpdateTrainerAvailabilityDto[],
  ) {
    return this.availabilityService.updateWeeklyTemplate(
      tenantId,
      trainerId,
      dtos,
    );
  }

  @Get(':trainerId/overrides')
  @RequirePermissions(PERMISSIONS.TRAINER_AVAILABILITY.READ)
  async getOverrides(
    @CurrentTenant() tenantId: string,
    @Param('trainerId') trainerId: string,
    @Query() query: OverridesQueryDto,
  ) {
    return this.availabilityService.getOverrides(
      tenantId,
      trainerId,
      query.dateFrom,
      query.dateTo,
    );
  }

  @Post(':trainerId/overrides')
  @RequirePermissions(PERMISSIONS.TRAINER_AVAILABILITY.UPDATE)
  async createOverride(
    @CurrentTenant() tenantId: string,
    @Param('trainerId') trainerId: string,
    @Body() dto: CreateTrainerAvailabilityOverrideDto,
  ) {
    return this.availabilityService.createOverride(tenantId, trainerId, dto);
  }

  @Delete(':trainerId/overrides/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.TRAINER_AVAILABILITY.UPDATE)
  async deleteOverride(
    @CurrentTenant() tenantId: string,
    @Param('trainerId') trainerId: string,
    @Param('id') id: string,
  ) {
    await this.availabilityService.deleteOverride(tenantId, trainerId, id);
  }

  @Get(':trainerId/slots')
  @RequirePermissions(PERMISSIONS.TRAINER_AVAILABILITY.READ)
  async getAvailableSlots(
    @CurrentTenant() tenantId: string,
    @Param('trainerId') trainerId: string,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getAvailableSlots(
      tenantId,
      trainerId,
      date,
    );
  }
}
