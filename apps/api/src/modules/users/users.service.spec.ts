import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { RolePermissionEntity } from '../../database/entities/role-permission.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { Repository, ObjectLiteral } from 'typeorm';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<UserEntity>;
  let tenantUsersRepository: MockRepository<TenantUserEntity>;
  let rolesRepository: MockRepository<RoleEntity>;
  let rolePermissionsRepository: MockRepository<RolePermissionEntity>;
  let permissionsRepository: MockRepository<PermissionEntity>;

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
    };
    tenantUsersRepository = {
      findOne: jest.fn(),
    };
    rolesRepository = {
      findOne: jest.fn(),
    };
    rolePermissionsRepository = {
      find: jest.fn(),
    };
    permissionsRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(TenantUserEntity),
          useValue: tenantUsersRepository,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: rolesRepository,
        },
        {
          provide: getRepositoryToken(RolePermissionEntity),
          useValue: rolePermissionsRepository,
        },
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: permissionsRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findOneByEmail', () => {
    it('should return user if found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as UserEntity;
      usersRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getPermissions', () => {
    it('should return superAdmin true if user is super admin', async () => {
      const mockUser = { id: '1', isSuperAdmin: true } as UserEntity;
      usersRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.getPermissions('1');
      expect(result).toEqual({ superAdmin: true });
    });

    it('should return empty permissions if no tenantId provided', async () => {
      const mockUser = { id: '1', isSuperAdmin: false } as UserEntity;
      usersRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.getPermissions('1');
      expect(result).toEqual({ superAdmin: false, permissions: [] });
    });

    it('should return all permissions if tenant role is super admin', async () => {
      const mockUser = { id: '1', isSuperAdmin: false } as UserEntity;
      const mockTenantUser = { roleId: 'role-1' } as TenantUserEntity;
      const mockRole = { id: 'role-1', isSuperAdmin: true } as RoleEntity;
      const mockPermissions = [
        { code: 'perm1' },
        { code: 'perm2' },
      ] as PermissionEntity[];

      usersRepository.findOne!.mockResolvedValue(mockUser);
      tenantUsersRepository.findOne!.mockResolvedValue(mockTenantUser);
      rolesRepository.findOne!.mockResolvedValue(mockRole);
      permissionsRepository.find!.mockResolvedValue(mockPermissions);

      const result = await service.getPermissions('1', 'tenant-1');
      expect(result).toEqual({
        superAdmin: false,
        permissions: ['perm1', 'perm2'],
      });
    });

    it('should return specific permissions for valid role', async () => {
      const mockUser = { id: '1', isSuperAdmin: false } as UserEntity;
      const mockTenantUser = { roleId: 'role-1' } as TenantUserEntity;
      const mockRole = { id: 'role-1', isSuperAdmin: false } as RoleEntity;
      const mockRolePermissions = [
        { permissionId: 'perm-id-1' },
      ] as RolePermissionEntity[];
      const mockPermissions = [
        { id: 'perm-id-1', code: 'perm1' },
      ] as PermissionEntity[];

      usersRepository.findOne!.mockResolvedValue(mockUser);
      tenantUsersRepository.findOne!.mockResolvedValue(mockTenantUser);
      rolesRepository.findOne!.mockResolvedValue(mockRole);
      rolePermissionsRepository.find!.mockResolvedValue(mockRolePermissions);
      permissionsRepository.find!.mockResolvedValue(mockPermissions);

      const result = await service.getPermissions('1', 'tenant-1');
      expect(result).toEqual({
        superAdmin: false,
        permissions: ['perm1'],
      });
    });

    it('should return empty permissions if user has no role in tenant', async () => {
      const mockUser = { id: '1', isSuperAdmin: false } as UserEntity;

      usersRepository.findOne!.mockResolvedValue(mockUser);
      tenantUsersRepository.findOne!.mockResolvedValue(null);

      const result = await service.getPermissions('1', 'tenant-1');
      expect(result).toEqual({ superAdmin: false, permissions: [] });
    });
  });
});
