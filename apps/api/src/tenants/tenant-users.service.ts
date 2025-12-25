import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';
import { UserEntity } from '../database/entities/user.entity';
import { RoleEntity } from '../database/entities/role.entity';

@Injectable()
export class TenantUsersService {
  constructor(
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [tenantUsers, total] = await this.tenantUserRepository.findAndCount({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (tenantUsers.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const userIds = tenantUsers.map((tu) => tu.userId);
    const roleIds = tenantUsers
      .map((tu) => tu.roleId)
      .filter((id): id is string => id !== null);

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });
    const roles =
      roleIds.length > 0
        ? await this.roleRepository.find({
            where: { id: In(roleIds) },
          })
        : [];

    const items = tenantUsers.map((tu) => {
      const user = users.find((u) => u.id === tu.userId);
      const role = roles.find((r) => r.id === tu.roleId);
      return {
        tenantId: tu.tenantId,
        userId: tu.userId,
        roleId: tu.roleId,
        user: user
          ? {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              status: user.status,
            }
          : null,
        role: role
          ? {
              id: role.id,
              name: role.name,
              isSuperAdmin: role.isSuperAdmin,
            }
          : null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, userId: string): Promise<any> {
    const membership = await this.tenantUserRepository.findOne({
      where: { tenantId, userId },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this tenant');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    const role = membership.roleId
      ? await this.roleRepository.findOne({
          where: { id: membership.roleId },
        })
      : null;

    return {
      tenantId: membership.tenantId,
      userId: membership.userId,
      roleId: membership.roleId,
      user: user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
          }
        : null,
      role: role
        ? {
            id: role.id,
            name: role.name,
            isSuperAdmin: role.isSuperAdmin,
          }
        : null,
    };
  }

  async create(
    tenantId: string,
    data: { email: string; fullName?: string; roleId?: string; password: string },
  ): Promise<any> {
    // Check if user already exists
    let user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (user) {
      throw new ConflictException('User with this email already exists. Use invite to add existing users.');
    }

    // Validate role if provided
    let role: RoleEntity | null = null;
    if (data.roleId) {
      role = await this.roleRepository.findOne({
        where: { id: data.roleId, tenantId },
      });
      if (!role) {
        throw new NotFoundException('Role not found in this tenant');
      }
    }

    // Create new user with provided password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    user = this.userRepository.create({
      email: data.email,
      fullName: data.fullName,
      passwordHash: hashedPassword,
      status: 'ACTIVE',
    });
    await this.userRepository.save(user);

    // Always create tenant membership (role is optional)
    const membership = this.tenantUserRepository.create({
      tenantId,
      userId: user.id,
      roleId: data.roleId || undefined,
    });
    await this.tenantUserRepository.save(membership);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
      },
      role: role
        ? {
            id: role.id,
            name: role.name,
            isSuperAdmin: role.isSuperAdmin,
          }
        : null,
    };
  }

  async inviteExistingUser(
    tenantId: string,
    data: { userId: string; roleId: string },
  ): Promise<any> {
    // Find user by ID
    const user = await this.userRepository.findOne({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    if (user.isSuperAdmin) {
      throw new BadRequestException('Cannot invite super admin users');
    }

    // Check if role exists and belongs to tenant
    const role = await this.roleRepository.findOne({
      where: { id: data.roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Role not found in this tenant');
    }

    // Check if already in tenant
    const existingMembership = await this.tenantUserRepository.findOne({
      where: { tenantId, userId: user.id },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this tenant');
    }

    // Create membership
    const membership = this.tenantUserRepository.create({
      tenantId,
      userId: user.id,
      roleId: data.roleId,
    });

    await this.tenantUserRepository.save(membership);

    return {
      tenantId: membership.tenantId,
      userId: membership.userId,
      roleId: membership.roleId,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
      },
      role: {
        id: role.id,
        name: role.name,
        isSuperAdmin: role.isSuperAdmin,
      },
    };
  }

  async updateRole(
    tenantId: string,
    userId: string,
    roleId: string | null,
  ): Promise<void> {
    // Check membership
    const membership = await this.tenantUserRepository.findOne({
      where: { tenantId, userId },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this tenant');
    }

    // If roleId is provided, validate it exists in tenant
    if (roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: roleId, tenantId },
      });
      if (!role) {
        throw new NotFoundException('Role not found in this tenant');
      }
    }

    // Update or clear the role
    membership.roleId = roleId === null ? null : roleId;
    await this.tenantUserRepository.save(membership);
  }

  async remove(tenantId: string, userId: string): Promise<void> {
    const membership = await this.tenantUserRepository.findOne({
      where: { tenantId, userId },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this tenant');
    }

    await this.tenantUserRepository.remove(membership);
  }

  async updateUser(
    tenantId: string,
    userId: string,
    data: {
      email?: string;
      fullName?: string;
      password?: string;
      roleId?: string | null;
    },
  ): Promise<any> {
    // Check membership
    const membership = await this.tenantUserRepository.findOne({
      where: { tenantId, userId },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this tenant');
    }

    // Get the user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update email if provided
    if (data.email !== undefined && data.email !== user.email) {
      // Check if email is already in use
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already in use');
      }
      user.email = data.email;
    }

    // Update fullName if provided
    if (data.fullName !== undefined) {
      user.fullName = data.fullName;
    }

    // Update password if provided
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      user.passwordHash = hashedPassword;
    }

    // Save user changes
    await this.userRepository.save(user);

    // Update role if provided
    if (data.roleId !== undefined) {
      if (data.roleId !== null) {
        // Validate role exists in tenant
        const role = await this.roleRepository.findOne({
          where: { id: data.roleId, tenantId },
        });
        if (!role) {
          throw new NotFoundException('Role not found in this tenant');
        }
      }
      membership.roleId = data.roleId === null ? null : data.roleId;
      await this.tenantUserRepository.save(membership);
    }

    // Fetch updated role info
    const role = membership.roleId
      ? await this.roleRepository.findOne({ where: { id: membership.roleId } })
      : null;

    return {
      tenantId: membership.tenantId,
      userId: membership.userId,
      roleId: membership.roleId,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
      },
      role: role
        ? {
            id: role.id,
            name: role.name,
            isSuperAdmin: role.isSuperAdmin,
          }
        : null,
    };
  }
}
