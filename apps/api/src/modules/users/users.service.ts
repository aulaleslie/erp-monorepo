import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { RolePermissionEntity } from '../../database/entities/role-permission.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { TenantEntity } from '../../database/entities/tenant.entity';
import {
  hashPassword,
  comparePassword,
} from '../../common/utils/password.util';
import { calculateSkip } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(TenantUserEntity)
    private tenantUsersRepository: Repository<TenantUserEntity>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity)
    private rolePermissionsRepository: Repository<RolePermissionEntity>,
    @InjectRepository(PermissionEntity)
    private permissionsRepository: Repository<PermissionEntity>,
  ) {}

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async getPermissions(
    userId: string,
    tenantId?: string,
  ): Promise<{ superAdmin: boolean; permissions?: string[] }> {
    const user = await this.findOneById(userId);
    if (!user) {
      // Should handle user not found, but for now assuming user exists as this is called after auth
      return { superAdmin: false, permissions: [] };
    }

    if (user.isSuperAdmin) {
      return { superAdmin: true };
    }

    if (!tenantId) {
      return { superAdmin: false, permissions: [] };
    }

    // Get tenant role
    const tenantUser = await this.tenantUsersRepository.findOne({
      where: { userId, tenantId },
    });

    if (!tenantUser) {
      return { superAdmin: false, permissions: [] };
    }

    // No role assigned - return empty permissions
    if (!tenantUser.roleId) {
      return { superAdmin: false, permissions: [] };
    }

    const role = await this.rolesRepository.findOne({
      where: { id: tenantUser.roleId },
    });

    if (!role) {
      return { superAdmin: false, permissions: [] };
    }

    if (role.isSuperAdmin) {
      // If tenant super admin, grant all PERMISSIONS
      // Fetch all permission codes
      const allPermissions = await this.permissionsRepository.find();
      return {
        superAdmin: false,
        permissions: allPermissions.map((p) => p.code),
      };
    }

    // Standard RBAC resolution
    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { roleId: role.id },
    });

    if (rolePermissions.length === 0) {
      return { superAdmin: false, permissions: [] };
    }

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    const permissions = await this.permissionsRepository.find({
      where: { id: In(permissionIds) },
    });

    return {
      superAdmin: false,
      permissions: permissions.map((p) => p.code),
    };
  }

  async updateProfile(
    userId: string,
    data: { fullName: string },
  ): Promise<UserEntity> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.fullName = data.fullName;
    return this.usersRepository.save(user);
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await hashPassword(newPassword);
    await this.usersRepository.save(user);
  }

  async getUserTenants(userId: string): Promise<
    Array<{
      tenant: { id: string; name: string; slug: string };
      role: { id: string; name: string; isSuperAdmin: boolean } | null;
    }>
  > {
    const tenantUsers = await this.tenantUsersRepository.find({
      where: { userId },
    });

    if (tenantUsers.length === 0) {
      return [];
    }

    // Fetch tenants and roles
    const tenantIds = tenantUsers.map((tu) => tu.tenantId);

    // Use query builder to get tenant info since we don't have relation defined
    // Only fetch ACTIVE tenants
    const tenants = await this.usersRepository.manager
      .getRepository(TenantEntity)
      .find({
        where: { id: In(tenantIds), status: 'ACTIVE' },
      });

    // Filter tenantUsers to only include those with active tenants
    const activeTenantIds = new Set(tenants.map((t) => t.id));
    const activeTenantUsers = tenantUsers.filter((tu) =>
      activeTenantIds.has(tu.tenantId),
    );

    const roleIds = activeTenantUsers
      .map((tu) => tu.roleId)
      .filter((id): id is string => id !== undefined && id !== null);

    const roles =
      roleIds.length > 0
        ? await this.rolesRepository.find({
            where: { id: In(roleIds) },
          })
        : [];

    return activeTenantUsers.map((tu) => {
      const tenant = tenants.find((t) => t.id === tu.tenantId);
      const role = tu.roleId ? roles.find((r) => r.id === tu.roleId) : null;

      return {
        tenant: tenant
          ? { id: tenant.id, name: tenant.name, slug: tenant.slug }
          : { id: tu.tenantId, name: 'Unknown', slug: '' },
        role: role
          ? { id: role.id, name: role.name, isSuperAdmin: role.isSuperAdmin }
          : null,
      };
    });
  }

  async searchInvitableUsers(
    tenantId: string,
    search: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: Array<{ id: string; email: string; fullName?: string }>;
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    // Get users already in this tenant
    const existingMemberships = await this.tenantUsersRepository.find({
      where: { tenantId },
      select: ['userId'],
    });
    const existingUserIds = existingMemberships.map((m) => m.userId);

    // Build query for users not in tenant and not super admins
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.isSuperAdmin = :isSuperAdmin', { isSuperAdmin: false })
      .andWhere('user.status = :status', { status: 'ACTIVE' });

    // Exclude users already in tenant
    if (existingUserIds.length > 0) {
      queryBuilder.andWhere('user.id NOT IN (:...existingUserIds)', {
        existingUserIds,
      });
    }

    // Apply search filter
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.fullName ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const users = await queryBuilder
      .select(['user.id', 'user.email', 'user.fullName'])
      .orderBy('user.email', 'ASC')
      .skip(calculateSkip(page, limit))
      .take(limit)
      .getMany();

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }
}
