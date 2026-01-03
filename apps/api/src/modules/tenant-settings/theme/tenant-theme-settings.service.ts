import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { TenantThemeEntity } from '../../../database/entities/tenant-theme.entity';
import { UpdateTenantThemeSettingsDto } from './dto/update-tenant-theme-settings.dto';
import { TenantThemeSettingsResponseDto } from './dto/tenant-theme-settings-response.dto';
import { THEME_PRESETS, THEME_ERRORS } from '@gym-monorepo/shared';

@Injectable()
export class TenantThemeSettingsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TenantThemeEntity)
    private readonly tenantThemeRepository: Repository<TenantThemeEntity>,
  ) {}

  async getSettings(tenantId: string): Promise<TenantThemeSettingsResponseDto> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(THEME_ERRORS.NOT_FOUND.message);
    }

    let theme = await this.tenantThemeRepository.findOne({
      where: { tenantId },
    });

    // If no theme exists, create one with default preset
    if (!theme) {
      const defaultPresetId = 'corporate-blue';
      theme = this.tenantThemeRepository.create({
        tenantId,
        presetId: defaultPresetId,
      });
      await this.tenantThemeRepository.save(theme);
    }

    const preset = THEME_PRESETS[theme.presetId];

    if (!preset) {
      throw new NotFoundException(THEME_ERRORS.INVALID_PRESET.message);
    }

    return {
      presetId: theme.presetId,
      colors: preset.colors,
      logoUrl: theme.logoUrl,
    };
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateTenantThemeSettingsDto,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(THEME_ERRORS.NOT_FOUND.message);
    }

    // Validate preset exists
    if (!THEME_PRESETS[dto.presetId]) {
      throw new NotFoundException(THEME_ERRORS.INVALID_PRESET.message);
    }

    let theme = await this.tenantThemeRepository.findOne({
      where: { tenantId },
    });

    if (!theme) {
      theme = this.tenantThemeRepository.create({
        tenantId,
        presetId: dto.presetId,
        logoUrl: dto.logoUrl,
      });
    } else {
      theme.presetId = dto.presetId;
      theme.logoUrl = dto.logoUrl;
    }

    await this.tenantThemeRepository.save(theme);
  }
}
