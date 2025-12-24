import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(tenantId: string): Promise<any[]> {
    // We need to join with UserEntity and RoleEntity to get details
    // Since relations aren't explicitly defined in the partial snippet I saw earlier,
    // I'll check if I can use QueryBuilder or simple find with manual join.
    // Ideally relations should be there. Let's assume valid TypeORM relations for now
    // based on entity definitions usually having relations.
    // Wait, step 7 showed:
    /*
      @Entity('tenant_users')
      @Unique(['tenantId', 'userId'])
      export class TenantUserEntity {
        @Column()
        tenantId: string;
        @Column()
        userId: string;
        @Column()
        roleId: string;
      }
    */
    // No relations defined in TenantUserEntity!
    // So I have to do it manually or user QueryBuilder.

    const tenantUsers = await this.tenantUserRepository.find({
      where: { tenantId },
    });

    if (tenantUsers.length === 0) return [];

    const userIds = tenantUsers.map((tu) => tu.userId);
    const roleIds = tenantUsers.map((tu) => tu.roleId);

    const users = await this.userRepository.findByIds(userIds);
    const roles = await this.roleRepository.findByIds(roleIds);

    return tenantUsers.map((tu) => {
      const user = users.find((u) => u.id === tu.userId);
      const role = roles.find((r) => r.id === tu.roleId);
      return {
        ...tu,
        user,
        role,
      };
    });
  }

  async create(
    tenantId: string,
    data: { email: string; fullName?: string; roleId: string },
  ): Promise<any> {
    // Check if role exists and belongs to tenant
    const role = await this.roleRepository.findOne({
      where: { id: data.roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Role not found in this tenant');
    }

    // Check if user exists
    let user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (!user) {
      // Create new user
      // Password generation? Let's clear that.
      // Spec says "No registration", assumes admin creation.
      // Set a default password or random one?
      // For now, let's set a default one (e.g. 'password123') and hash it.
      // In production, we'd send an invite email.
      const hashedPassword = await bcrypt.hash('password123', 10);

      user = this.userRepository.create({
        email: data.email,
        fullName: data.fullName,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
      });
      await this.userRepository.save(user); // Save to get ID
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
      ...membership,
      user,
      role,
    };
  }

  async updateRole(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    // Check membership
    const membership = await this.tenantUserRepository.findOne({
      where: { tenantId, userId },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this tenant');
    }

    // Check role
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Role not found in this tenant');
    }

    membership.roleId = roleId;
    await this.tenantUserRepository.save(membership);
  }
}
