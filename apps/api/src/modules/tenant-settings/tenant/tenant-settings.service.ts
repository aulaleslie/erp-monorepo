import { Injectable } from '@nestjs/common';
import { TenantsService } from '../../tenants/tenants.service';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@Injectable()
export class TenantSettingsService {
  constructor(private readonly tenantsService: TenantsService) {}

  async getSettings(tenantId: string): Promise<TenantEntity> {
    return this.tenantsService.getTenantById(tenantId);
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateTenantSettingsDto,
  ): Promise<TenantEntity> {
    return this.tenantsService.update(tenantId, dto);
  }
}
