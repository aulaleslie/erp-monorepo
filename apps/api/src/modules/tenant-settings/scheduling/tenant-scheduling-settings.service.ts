import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantSchedulingSettingsEntity } from '../../../database/entities/tenant-scheduling-settings.entity';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { TenantSchedulingSettingsResponseDto } from './dto/tenant-scheduling-settings-response.dto';
import { UpdateTenantSchedulingSettingsDto } from './dto/update-tenant-scheduling-settings.dto';

@Injectable()
export class TenantSchedulingSettingsService {
  constructor(
    @InjectRepository(TenantSchedulingSettingsEntity)
    private readonly repository: Repository<TenantSchedulingSettingsEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async getSettings(
    tenantId: string,
  ): Promise<TenantSchedulingSettingsResponseDto> {
    const settings = await this.repository.findOne({
      where: { tenantId },
    });

    if (!settings) {
      // Return defaults if no settings record exists yet
      return {
        slotDurationMinutes: 60,
        bookingLeadTimeHours: 0,
        cancellationWindowHours: 24,
      };
    }

    return {
      slotDurationMinutes: settings.slotDurationMinutes,
      bookingLeadTimeHours: settings.bookingLeadTimeHours,
      cancellationWindowHours: settings.cancellationWindowHours,
    };
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateTenantSchedulingSettingsDto,
  ): Promise<TenantSchedulingSettingsResponseDto> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    let settings = await this.repository.findOne({
      where: { tenantId },
    });

    if (!settings) {
      settings = this.repository.create({
        tenantId,
        ...dto,
      });
    } else {
      Object.assign(settings, dto);
    }

    const saved = await this.repository.save(settings);

    return {
      slotDurationMinutes: saved.slotDurationMinutes,
      bookingLeadTimeHours: saved.bookingLeadTimeHours,
      cancellationWindowHours: saved.cancellationWindowHours,
    };
  }
}
