import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoleEntity } from '../../database/entities/role.entity';
import { RolePermissionEntity } from '../../database/entities/role-permission.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { Repository, ObjectLiteral } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: MockRepository<RoleEntity>;
  let rolePermissionRepository: MockRepository<RolePermissionEntity>;
  let permissionRepository: MockRepository<PermissionEntity>;
  let tenantUserRepository: MockRepository<TenantUserEntity>;
  let userRepository: MockRepository<UserEntity>;

  beforeEach(async () => {
    roleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    rolePermissionRepository = {
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    permissionRepository = {
      find: jest.fn(),
    };
    tenantUserRepository = {
      find: jest.fn(),
    };
    userRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(RoleEntity), useValue: roleRepository },
        {
          provide: getRepositoryToken(RolePermissionEntity),
          useValue: rolePermissionRepository,
        },
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: permissionRepository,
        },
        {
          provide: getRepositoryToken(TenantUserEntity),
          useValue: tenantUserRepository,
        },
        { provide: getRepositoryToken(UserEntity), useValue: userRepository },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('findAll', () => {
    it('should return paginated roles excluding super admin', async () => {
      const roles = [
        { id: 'role-1', name: 'Editor', isSuperAdmin: false },
      ] as RoleEntity[];
      roleRepository.findAndCount!.mockResolvedValue([roles, 10]);

      const result = await service.findAll('tenant-1', 1, 10);

      expect(result.items).toEqual(roles);
      expect(result.total).toBe(10);
      expect(roleRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isSuperAdmin: false },
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return role if found', async () => {
      const role = {
        id: 'role-1',
        name: 'Editor',
        tenantId: 'tenant-1',
      } as RoleEntity;
      roleRepository.findOne!.mockResolvedValue(role);

      const result = await service.findOne('tenant-1', 'role-1');
      expect(result).toEqual(role);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'role-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create new role', async () => {
      const newRole = { id: 'role-1', name: 'New Role', tenantId: 'tenant-1' };
      roleRepository.find!.mockResolvedValue([]); // No existing roles with same name
      roleRepository.create!.mockReturnValue(newRole);
      roleRepository.save!.mockResolvedValue(newRole);

      const result = await service.create('tenant-1', { name: 'New Role' });

      expect(result).toEqual(newRole);
    });

    it('should throw BadRequestException if role name exists', async () => {
      roleRepository.find!.mockResolvedValue([
        { id: 'role-1', name: 'Editor' },
      ]);

      await expect(
        service.create('tenant-1', { name: 'Editor' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete non-super-admin role', async () => {
      const role = {
        id: 'role-1',
        name: 'Editor',
        isSuperAdmin: false,
      } as RoleEntity;
      roleRepository.findOne!.mockResolvedValue(role);
      roleRepository.remove!.mockResolvedValue(role);

      await service.delete('tenant-1', 'role-1');

      expect(roleRepository.remove).toHaveBeenCalledWith(role);
    });

    it('should throw ForbiddenException when deleting super admin role', async () => {
      const role = {
        id: 'role-1',
        name: 'Super Admin',
        isSuperAdmin: true,
      } as RoleEntity;
      roleRepository.findOne!.mockResolvedValue(role);

      await expect(service.delete('tenant-1', 'role-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return empty array if no permissions', async () => {
      rolePermissionRepository.find!.mockResolvedValue([]);

      const result = await service.getPermissionsForRole('role-1');
      expect(result).toEqual([]);
    });

    it('should return permission codes for role', async () => {
      rolePermissionRepository.find!.mockResolvedValue([
        { roleId: 'role-1', permissionId: 'perm-1' },
        { roleId: 'role-1', permissionId: 'perm-2' },
      ]);
      permissionRepository.find!.mockResolvedValue([
        { id: 'perm-1', code: 'users.read' },
        { id: 'perm-2', code: 'users.write' },
      ]);

      const result = await service.getPermissionsForRole('role-1');
      expect(result).toEqual(['users.read', 'users.write']);
    });
  });

  describe('getAssignedUsers', () => {
    it('should return empty array if no users assigned', async () => {
      tenantUserRepository.find!.mockResolvedValue([]);

      const result = await service.getAssignedUsers('tenant-1', 'role-1');
      expect(result).toEqual([]);
    });

    it('should return users assigned to role', async () => {
      const tenantUsers = [{ userId: 'user-1' }, { userId: 'user-2' }];
      const users = [
        { id: 'user-1', email: 'user1@test.com' },
        { id: 'user-2', email: 'user2@test.com' },
      ] as UserEntity[];

      tenantUserRepository.find!.mockResolvedValue(tenantUsers);
      userRepository.find!.mockResolvedValue(users);

      const result = await service.getAssignedUsers('tenant-1', 'role-1');
      expect(result).toEqual(users);
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to role', async () => {
      const role = { id: 'role-1', tenantId: 'tenant-1' } as RoleEntity;
      roleRepository.findOne!.mockResolvedValue(role);
      permissionRepository.find!.mockResolvedValue([
        { id: 'perm-1', code: 'users.read' },
      ]);
      rolePermissionRepository.delete!.mockResolvedValue({});
      rolePermissionRepository.save!.mockResolvedValue([]);

      await service.assignPermissions('tenant-1', 'role-1', ['users.read']);

      expect(rolePermissionRepository.delete).toHaveBeenCalledWith({
        roleId: 'role-1',
      });
      expect(rolePermissionRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid permission codes', async () => {
      const role = { id: 'role-1', tenantId: 'tenant-1' } as RoleEntity;
      roleRepository.findOne!.mockResolvedValue(role);
      permissionRepository.find!.mockResolvedValue([]); // No matching permissions

      await expect(
        service.assignPermissions('tenant-1', 'role-1', ['invalid.permission']),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
