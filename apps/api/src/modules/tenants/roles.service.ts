import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, FindOptionsWhere } from 'typeorm';
import { RoleEntity } from '../../database/entities/role.entity';
import { RolePermissionEntity } from '../../database/entities/role-permission.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { UserEntity } from '../../database/entities/user.entity';
import {
  PaginatedResponse,
  paginate,
  calculateSkip,
} from '../../common/dto/pagination.dto';
import { createValidationBuilder } from '../../common/utils/validation.util';
import { ROLE_ERRORS } from '@gym-monorepo/shared';

const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

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

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    options?: { includeSuperAdminRoles?: boolean },
  ): Promise<PaginatedResponse<RoleEntity>> {
    const includeSuperAdminRoles = options?.includeSuperAdminRoles ?? false;
    const where: FindOptionsWhere<RoleEntity> = {
      tenantId,
      name: Not(SUPER_ADMIN_ROLE_NAME),
    };

    if (!includeSuperAdminRoles) {
      where.isSuperAdmin = false;
    }

    const [items, total] = await this.roleRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: calculateSkip(page, limit),
      take: limit,
    });

    return paginate(items, total, page, limit);
  }

  async findOne(tenantId: string, id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
    });
    if (!role) {
      throw new NotFoundException(ROLE_ERRORS.NOT_FOUND.message);
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
    const roles = await this.roleRepository.find({
      where: { tenantId },
    });

    const duplicate = roles.find(
      (r) => normalize(r.name) === normalizedName && r.id !== excludeId,
    );

    if (duplicate) {
      const validator = createValidationBuilder();
      validator.addError('name', ROLE_ERRORS.NAME_EXISTS.message);
      validator.throwIfErrors();
    }
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const role = await this.findOne(tenantId, id);
    if (role.isSuperAdmin) {
      throw new ForbiddenException(
        ROLE_ERRORS.CANNOT_DELETE_SUPER_ADMIN.message,
      );
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
    const _role = await this.findOne(tenantId, roleId); // Ensure role exists and belongs to tenant

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
          `${ROLE_ERRORS.INVALID_PERMISSIONS.message}: ${missing.join(', ')}`,
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
