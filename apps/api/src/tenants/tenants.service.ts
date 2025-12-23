import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TenantEntity } from '../database/entities/tenant.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
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
}
