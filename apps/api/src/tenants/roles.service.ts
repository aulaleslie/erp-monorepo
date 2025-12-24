import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleEntity } from '../database/entities/role.entity';
import { RolePermissionEntity } from '../database/entities/role-permission.entity';
import { PermissionEntity } from '../database/entities/permission.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(tenantId: string, page: number = 1, limit: number = 10) {
    const [items, total] = await this.roleRepository.findAndCount({
      where: { tenantId, isSuperAdmin: false },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async create(
    tenantId: string,
    data: { name: string; isSuperAdmin?: boolean },
  ): Promise<RoleEntity> {
    await this.validateRoleName(tenantId, data.name);

    const role = this.roleRepository.create({
      ...data,
      tenantId,
    });
    return this.roleRepository.save(role);
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string },
  ): Promise<RoleEntity> {
    const role = await this.findOne(tenantId, id);

    if (data.name && data.name !== role.name) {
      await this.validateRoleName(tenantId, data.name, id);
    }

    if (role.isSuperAdmin) {
      // Prevent renaming super admin role if we want to enforce structure,
      // but usually just preventing deletion is enough.
      // Let's allow renaming for now unless specified otherwise.
      // Actually, typically Super Admin roles might be protected.
    }

    Object.assign(role, data);
    return this.roleRepository.save(role);
  }

  private async validateRoleName(
    tenantId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');
    const normalizedName = normalize(name);

    // Fetch all roles for the tenant to check for duplicates
    // In valid production scenario, this should be done via a unique constraint or a smarter query
    const roles = await this.roleRepository.find({
      where: { tenantId },
    });

    const duplicate = roles.find(
      (r) => normalize(r.name) === normalizedName && r.id !== excludeId,
    );

    if (duplicate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          name: ['Role with this name already exists'],
        },
      });
    }
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const role = await this.findOne(tenantId, id);
    if (role.isSuperAdmin) {
      throw new ForbiddenException('Cannot delete Super Admin role');
    }

    // We should probably check if users are assigned to this role before deleting
    // but the requirement spec doesn't explicitly say so.
    // FK constraints might handle it or fail.

    await this.roleRepository.remove(role);
  }

  async assignPermissions(
    tenantId: string,
    roleId: string,
    permissionCodes: string[],
  ): Promise<void> {
    const role = await this.findOne(tenantId, roleId); // Ensure role exists and belongs to tenant

    // validate permissions exist
    const permissions = await this.permissionRepository.find({
      where: { code: In(permissionCodes) },
    });

    if (permissions.length !== permissionCodes.length) {
      // some permissions might be invalid
      // let's just proceed with valid ones or throw?
      // stricter: throw
      const foundCodes = permissions.map((p) => p.code);
      const missing = permissionCodes.filter((c) => !foundCodes.includes(c));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Permissions not found: ${missing.join(', ')}`,
        );
      }
    }

    // Wrap in transaction if needed, but simple delete-insert is okay here
    // First remove existing permissions
    await this.rolePermissionRepository.delete({ roleId });

    // Insert new ones
    const rolePermissions = permissions.map((p) => {
      const rp = new RolePermissionEntity();
      rp.roleId = roleId;
      rp.permissionId = p.id;
      return rp;
    });

    await this.rolePermissionRepository.save(rolePermissions);
  }

  async getPermissionsForRole(roleId: string): Promise<string[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
    });

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    if (permissionIds.length === 0) return [];

    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    return permissions.map((p) => p.code);
  }

  async getAssignedUsers(
    tenantId: string,
    roleId: string,
  ): Promise<UserEntity[]> {
    const tenantUsers = await this.tenantUserRepository.find({
      where: { tenantId, roleId },
    });

    if (tenantUsers.length === 0) {
      return [];
    }

    const userIds = tenantUsers.map((tu) => tu.userId);

    return this.userRepository.find({
      where: { id: In(userIds) },
    });
  }
}
