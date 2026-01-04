import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { TaxEntity, TaxStatus } from '../../database/entities/tax.entity';
import { TenantTaxEntity } from '../../database/entities/tenant-tax.entity';
import { TenantThemeEntity } from '../../database/entities/tenant-theme.entity';
import {
  PaginatedResponse,
  paginate,
  calculateSkip,
} from '../../common/dto/pagination.dto';
import { createValidationBuilder } from '../../common/utils/validation.util';
import { TenantType, THEME_PRESETS, Locale } from '@gym-monorepo/shared';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(TaxEntity)
    private readonly taxRepository: Repository<TaxEntity>,
    @InjectRepository(TenantTaxEntity)
    private readonly tenantTaxRepository: Repository<TenantTaxEntity>,
    @InjectRepository(TenantThemeEntity)
    private readonly tenantThemeRepository: Repository<TenantThemeEntity>,
  ) {}

  async getMyTenants(userId: string): Promise<TenantEntity[]> {
    const memberships = await this.tenantUserRepository.find({
      where: { userId },
    });

    if (memberships.length === 0) {
      return [];
    }

    const tenantIds = memberships.map((m) => m.tenantId);
    return this.tenantRepository.find({
      where: { id: In(tenantIds), status: 'ACTIVE' },
    });
  }

  async validateTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const membership = await this.tenantUserRepository.findOne({
      where: { userId, tenantId },
    });
    return !!membership;
  }

  async getTenantById(tenantId: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['taxes', 'taxes.tax', 'theme'],
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async create(
    userId: string,
    data: {
      name: string;
      slug: string;
      type?: TenantType;
      isTaxable?: boolean;
      language?: Locale;
      taxIds?: string[];
      themePresetId?: string;
    },
  ): Promise<TenantEntity> {
    const validator = createValidationBuilder();
    const taxIds = data.taxIds ?? [];
    const isTaxable = data.isTaxable ?? false;
    const uniqueTaxIds = Array.from(new Set(taxIds));
    const themePresetId = data.themePresetId ?? 'corporate-blue';
    const language = data.language ?? Locale.EN;

    const existingSlug = await this.tenantRepository.findOne({
      where: { slug: data.slug },
    });
    if (existingSlug) {
      validator.addError('slug', 'Slug is already taken');
    }

    const existingName = await this.tenantRepository.findOne({
      where: { name: data.name },
    });
    if (existingName) {
      validator.addError('name', 'Name is already taken');
    }

    // Validate theme preset
    if (data.themePresetId) {
      const isValidPreset = Object.values(THEME_PRESETS).some(
        (preset) => preset.id === data.themePresetId,
      );
      if (!isValidPreset) {
        validator.addError('themePresetId', 'Invalid theme preset ID');
      }
    }

    if (taxIds.length > 0 && !isTaxable) {
      validator.addError('taxIds', 'Taxes can only be set for taxable tenants');
    }

    if (isTaxable && taxIds.length === 0) {
      validator.addError(
        'taxIds',
        'Tax selection is required for taxable tenants',
      );
    }

    if (taxIds.length > 0) {
      if (uniqueTaxIds.length !== taxIds.length) {
        validator.addError('taxIds', 'Duplicate tax IDs are not allowed');
      }

      const taxes = await this.taxRepository.find({
        where: { id: In(uniqueTaxIds), status: TaxStatus.ACTIVE },
      });

      if (taxes.length !== uniqueTaxIds.length) {
        validator.addError(
          'taxIds',
          'One or more tax IDs are invalid or inactive',
        );
      }
    }

    validator.throwIfErrors();

    const tenant = this.tenantRepository.create({
      name: data.name,
      slug: data.slug,
      status: 'ACTIVE',
      type: data.type ?? TenantType.GYM,
      isTaxable,
      language,
    });
    await this.tenantRepository.save(tenant);

    // Create a Super Admin role for this tenant
    const superAdminRole = this.roleRepository.create({
      tenantId: tenant.id,
      name: 'Super Admin',
      isSuperAdmin: true,
    });
    await this.roleRepository.save(superAdminRole);

    // Assign the creator as Super Admin
    const membership = this.tenantUserRepository.create({
      tenantId: tenant.id,
      userId,
      roleId: superAdminRole.id,
    });
    await this.tenantUserRepository.save(membership);

    // Create default theme for the tenant
    const theme = this.tenantThemeRepository.create({
      tenantId: tenant.id,
      presetId: themePresetId,
    });
    await this.tenantThemeRepository.save(theme);

    if (uniqueTaxIds.length > 0) {
      const defaultTaxId = uniqueTaxIds[0];
      const tenantTaxes = uniqueTaxIds.map((taxId) =>
        this.tenantTaxRepository.create({
          tenantId: tenant.id,
          taxId,
          isDefault: taxId === defaultTaxId,
        }),
      );
      await this.tenantTaxRepository.save(tenantTaxes);
    }

    return tenant;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status: 'ACTIVE' | 'DISABLED' = 'ACTIVE',
  ): Promise<PaginatedResponse<TenantEntity>> {
    const [items, total] = await this.tenantRepository.findAndCount({
      skip: calculateSkip(page, limit),
      take: limit,
      order: {
        createdAt: 'DESC',
      },
      where: { status },
    });

    return paginate(items, total, page, limit);
  }

  async update(
    id: string,
    data: Partial<TenantEntity> & { taxIds?: string[]; themePresetId?: string },
  ): Promise<TenantEntity> {
    const tenant = await this.getTenantById(id);
    const validator = createValidationBuilder();
    const hasTaxIds = Object.hasOwn(data, 'taxIds');
    const taxIds = data.taxIds ?? [];
    const uniqueTaxIds = Array.from(new Set(taxIds));
    const nextIsTaxable = data.isTaxable ?? tenant.isTaxable;

    if (data.slug) {
      const existingSlug = await this.tenantRepository.findOne({
        where: { slug: data.slug, id: Not(id) },
      });
      if (existingSlug) {
        validator.addError('slug', 'Slug is already taken');
      }
    }

    if (data.name) {
      const existingName = await this.tenantRepository.findOne({
        where: { name: data.name, id: Not(id) },
      });
      if (existingName) {
        validator.addError('name', 'Name is already taken');
      }
    }

    // Validate theme preset
    if (data.themePresetId) {
      const isValidPreset = Object.values(THEME_PRESETS).some(
        (preset) => preset.id === data.themePresetId,
      );
      if (!isValidPreset) {
        validator.addError('themePresetId', 'Invalid theme preset ID');
      }
    }

    if (hasTaxIds && uniqueTaxIds.length > 0 && !nextIsTaxable) {
      validator.addError('taxIds', 'Taxes can only be set for taxable tenants');
    }

    if (hasTaxIds && nextIsTaxable && uniqueTaxIds.length === 0) {
      validator.addError(
        'taxIds',
        'Tax selection is required for taxable tenants',
      );
    }

    if (hasTaxIds && uniqueTaxIds.length > 0) {
      if (uniqueTaxIds.length !== taxIds.length) {
        validator.addError('taxIds', 'Duplicate tax IDs are not allowed');
      }

      const taxes = await this.taxRepository.find({
        where: { id: In(uniqueTaxIds), status: TaxStatus.ACTIVE },
      });

      if (taxes.length !== uniqueTaxIds.length) {
        validator.addError(
          'taxIds',
          'One or more tax IDs are invalid or inactive',
        );
      }
    }

    if (!hasTaxIds && nextIsTaxable) {
      const existingTaxCount = await this.tenantTaxRepository.count({
        where: { tenantId: id },
      });
      if (existingTaxCount === 0) {
        validator.addError(
          'taxIds',
          'Tax selection is required for taxable tenants',
        );
      }
    }

    validator.throwIfErrors();

    const { taxIds: _taxIds, themePresetId, ...tenantUpdate } = data;
    Object.assign(tenant, tenantUpdate);
    await this.tenantRepository.save(tenant);

    // Update theme if provided
    if (themePresetId) {
      const existingTheme = await this.tenantThemeRepository.findOne({
        where: { tenantId: id },
      });
      if (existingTheme) {
        existingTheme.presetId = themePresetId;
        await this.tenantThemeRepository.save(existingTheme);
      } else {
        const newTheme = this.tenantThemeRepository.create({
          tenantId: id,
          presetId: themePresetId,
        });
        await this.tenantThemeRepository.save(newTheme);
      }
    }

    if (data.isTaxable === false) {
      await this.tenantTaxRepository.delete({ tenantId: id });
    }

    if (hasTaxIds) {
      await this.tenantTaxRepository.delete({ tenantId: id });
      if (uniqueTaxIds.length > 0) {
        const defaultTaxId = uniqueTaxIds[0];
        const tenantTaxes = uniqueTaxIds.map((taxId) =>
          this.tenantTaxRepository.create({
            tenantId: id,
            taxId,
            isDefault: taxId === defaultTaxId,
          }),
        );
        await this.tenantTaxRepository.save(tenantTaxes);
      }
    }

    // Return the updated tenant with relations
    return this.getTenantById(id);
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.getTenantById(id);
    tenant.status = 'DISABLED';
    await this.tenantRepository.save(tenant);
  }
}
