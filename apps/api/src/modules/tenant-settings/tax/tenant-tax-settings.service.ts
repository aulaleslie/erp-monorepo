import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import { TaxEntity, TaxStatus } from '../../../database/entities/tax.entity';
import { TenantTaxEntity } from '../../../database/entities/tenant-tax.entity';
import { UpdateTenantTaxSettingsDto } from './dto/update-tenant-tax-settings.dto';
import { TenantTaxSettingsResponseDto } from './dto/tenant-tax-settings-response.dto';

@Injectable()
export class TenantTaxSettingsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TaxEntity)
    private readonly taxRepository: Repository<TaxEntity>,
    @InjectRepository(TenantTaxEntity)
    private readonly tenantTaxRepository: Repository<TenantTaxEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getSettings(tenantId: string): Promise<TenantTaxSettingsResponseDto> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const allActiveTaxes = await this.taxRepository.find({
      where: { status: TaxStatus.ACTIVE },
    });

    const tenantTaxes = await this.tenantTaxRepository.find({
      where: { tenantId },
      relations: ['tax'],
    });

    const selectedTaxIds = new Set(tenantTaxes.map((tt) => tt.taxId));
    // Find the default tax ID, if any
    const defaultTaxId = tenantTaxes.find((tt) => tt.isDefault)?.taxId;

    const taxesDto = allActiveTaxes.map((tax) => {
      const isSelected = selectedTaxIds.has(tax.id);
      return {
        id: tax.id,
        name: tax.name,
        code: tax.code,
        rate: Number(tax.rate),
        amount: Number(tax.amount),
        type: tax.type,
        isSelected,
        isDefault: tax.id === defaultTaxId,
      };
    });

    return {
      isTaxable: tenant.isTaxable,
      selectedTaxIds: Array.from(selectedTaxIds),
      defaultTaxId: defaultTaxId ?? null,
      taxes: taxesDto,
    };
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateTenantTaxSettingsDto,
  ): Promise<void> {
    const { taxIds, defaultTaxId } = dto;

    // Transactional update
    await this.dataSource.transaction(async (manager) => {
      // 1. Check Tenant
      const tenant = await manager.findOne(TenantEntity, {
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      if (!tenant.isTaxable) {
        throw new ConflictException(
          'Tenant is not taxable. Enable tax capability first.',
        );
      }

      // 2. Validate Taxes
      if (taxIds.length > 0) {
        const taxes = await manager.find(TaxEntity, {
          where: {
            id: In(taxIds),
            status: TaxStatus.ACTIVE,
          },
        });

        if (taxes.length !== taxIds.length) {
          throw new BadRequestException(
            'One or more tax IDs are invalid or inactive',
          );
        }
      }

      // 3. Validate Default
      let resolvedDefaultId = defaultTaxId;
      if (defaultTaxId && !taxIds.includes(defaultTaxId)) {
        throw new BadRequestException(
          'Default tax must be one of the selected taxes',
        );
      }

      // If no default provided but taxes selected, pick the first one
      if (!resolvedDefaultId && taxIds.length > 0) {
        resolvedDefaultId = taxIds[0];
      }
      
      // If taxes are empty, default must be null (or undefined)
      if (taxIds.length === 0) {
        resolvedDefaultId = undefined;
      }

      // 4. Update Mappings
      // Delete existing
      await manager.delete(TenantTaxEntity, { tenantId });

      // Insert new
      if (taxIds.length > 0) {
        const newMappings = taxIds.map((taxId) => ({
            tenantId,
            taxId,
            isDefault: taxId === resolvedDefaultId,
        }));
        
        // Use create then save to trigger listeners/subscribers if any (Audit)
        // Or insert directly for bulk. Since TenantTaxEntity has BaseAuditEntity, better to use save or insert but ensuring audit columns?
        // insert() usually doesn't trigger subscribers. save() does.
        // For audit logs, we'd want to save. But doing N saves might be slow? n is small here (taxes).
        const entities = manager.create(TenantTaxEntity, newMappings);
        await manager.save(TenantTaxEntity, entities);
      }
    });
  }
}
