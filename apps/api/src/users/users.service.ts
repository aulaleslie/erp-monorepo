import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { RolePermissionEntity } from '../database/entities/role-permission.entity';
import { PermissionEntity } from '../database/entities/permission.entity';
import { In } from 'typeorm';

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
}
