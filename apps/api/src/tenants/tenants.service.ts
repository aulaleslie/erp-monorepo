import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { TenantEntity } from '../database/entities/tenant.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';
import { RoleEntity } from '../database/entities/role.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
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
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async create(
    userId: string,
    data: { name: string; slug: string },
  ): Promise<TenantEntity> {
    const errors: Record<string, string[]> = {};

    const existingSlug = await this.tenantRepository.findOne({
      where: { slug: data.slug },
    });
    if (existingSlug) {
      errors.slug = ['Slug is already taken'];
    }

    const existingName = await this.tenantRepository.findOne({
      where: { name: data.name },
    });
    if (existingName) {
      errors.name = ['Name is already taken'];
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    const tenant = this.tenantRepository.create({
      name: data.name,
      slug: data.slug,
      status: 'DISABLED',
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

    return tenant;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [items, total] = await this.tenantRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: Partial<TenantEntity>): Promise<TenantEntity> {
    const tenant = await this.getTenantById(id);

    const errors: Record<string, string[]> = {};

    if (data.slug) {
      const existingSlug = await this.tenantRepository.findOne({
        where: { slug: data.slug, id: Not(id) },
      });
      if (existingSlug) {
        errors.slug = ['Slug is already taken'];
      }
    }

    if (data.name) {
      const existingName = await this.tenantRepository.findOne({
        where: { name: data.name, id: Not(id) },
      });
      if (existingName) {
        errors.name = ['Name is already taken'];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    Object.assign(tenant, data);
    return this.tenantRepository.save(tenant);
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.getTenantById(id);
    tenant.status = 'DISABLED';
    await this.tenantRepository.save(tenant);
  }
}
