import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { TenantThemeEntity } from '../../../database/entities/tenant-theme.entity';
import { UpdateTenantThemeSettingsDto } from './dto/update-tenant-theme-settings.dto';
import { TenantThemeSettingsResponseDto } from './dto/tenant-theme-settings-response.dto';
import { THEME_PRESETS, THEME_ERRORS } from '@gym-monorepo/shared';

const resolvePresetId = (presetId: string) => {
  if (THEME_PRESETS[presetId]) {
    return presetId;
  }

  const normalizedPresetId = presetId.toLowerCase().replace(/_/g, '-');
  return THEME_PRESETS[normalizedPresetId] ? normalizedPresetId : presetId;
};

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

    const resolvedPresetId = resolvePresetId(theme.presetId);
    const preset = THEME_PRESETS[resolvedPresetId];

    if (!preset) {
      throw new NotFoundException(THEME_ERRORS.INVALID_PRESET.message);
    }

    if (resolvedPresetId !== theme.presetId) {
      theme.presetId = resolvedPresetId;
      await this.tenantThemeRepository.save(theme);
    }

    return {
      presetId: resolvedPresetId,
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
    const resolvedPresetId = resolvePresetId(dto.presetId);

    if (!THEME_PRESETS[resolvedPresetId]) {
      throw new NotFoundException(THEME_ERRORS.INVALID_PRESET.message);
    }

    let theme = await this.tenantThemeRepository.findOne({
      where: { tenantId },
    });

    if (!theme) {
      theme = this.tenantThemeRepository.create({
        tenantId,
        presetId: resolvedPresetId,
        logoUrl: dto.logoUrl,
      });
    } else {
      theme.presetId = resolvedPresetId;
      theme.logoUrl = dto.logoUrl;
    }

    await this.tenantThemeRepository.save(theme);
  }
}
