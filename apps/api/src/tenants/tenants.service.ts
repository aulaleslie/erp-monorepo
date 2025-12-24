import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  async validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const membership = await this.tenantUserRepository.findOne({
      where: { userId, tenantId },
    });
    return !!membership;
  }

  async getTenantById(tenantId: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async create(userId: string, data: { name: string; slug: string }): Promise<TenantEntity> {
    // strict: checking if slug exists logic might be needed but db has unique constraint.
    const tenant = this.tenantRepository.create({
      name: data.name,
      slug: data.slug,
      status: 'ACTIVE',
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
}

