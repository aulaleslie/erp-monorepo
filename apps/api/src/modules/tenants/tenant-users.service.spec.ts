import { Test, TestingModule } from '@nestjs/testing';
import { TenantUsersService } from './tenant-users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { Repository, ObjectLiteral } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('TenantUsersService', () => {
  let service: TenantUsersService;
  let tenantUserRepository: MockRepository<TenantUserEntity>;
  let userRepository: MockRepository<UserEntity>;
  let roleRepository: MockRepository<RoleEntity>;

  beforeEach(async () => {
    tenantUserRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    userRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    roleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantUsersService,
        {
          provide: getRepositoryToken(TenantUserEntity),
          useValue: tenantUserRepository,
        },
        { provide: getRepositoryToken(UserEntity), useValue: userRepository },
        { provide: getRepositoryToken(RoleEntity), useValue: roleRepository },
      ],
    }).compile();

    service = module.get<TenantUsersService>(TenantUsersService);
  });

  describe('findAll', () => {
    it('should return empty paginated result if no tenant users', async () => {
      tenantUserRepository.findAndCount!.mockResolvedValue([[], 0]);

      const result = await service.findAll('tenant-1', 1, 10);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return paginated tenant users with user and role info', async () => {
      const tenantUsers = [
        {
          id: 'tu-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          roleId: 'role-1',
        },
      ] as unknown as TenantUserEntity[];
      const users = [
        { id: 'user-1', email: 'test@test.com', fullName: 'Test User' },
      ] as UserEntity[];
      const roles = [{ id: 'role-1', name: 'Editor' }] as RoleEntity[];

      tenantUserRepository.findAndCount!.mockResolvedValue([tenantUsers, 1]);
      userRepository.find!.mockResolvedValue(users);
      roleRepository.find!.mockResolvedValue(roles);

      const result = await service.findAll('tenant-1', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].user!.email).toBe('test@test.com');
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return tenant user with user and role info', async () => {
      const membership = {
        id: 'tu-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'role-1',
      } as unknown as TenantUserEntity;
      const user = { id: 'user-1', email: 'test@test.com' } as UserEntity;
      const role = { id: 'role-1', name: 'Editor' } as RoleEntity;

      tenantUserRepository.findOne!.mockResolvedValue(membership);
      userRepository.findOne!.mockResolvedValue(user);
      roleRepository.findOne!.mockResolvedValue(role);

      const result = await service.findOne('tenant-1', 'user-1');

      expect(result.user!.email).toBe('test@test.com');
      expect(result.role?.name).toBe('Editor');
    });

    it('should throw NotFoundException if user not a member', async () => {
      tenantUserRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create new user and membership', async () => {
      userRepository.findOne!.mockResolvedValue(null); // No existing user
      roleRepository.findOne!.mockResolvedValue({
        id: 'role-1',
        name: 'Editor',
      });

      const newUser = { id: 'user-1', email: 'new@test.com' };
      const newMembership = {
        id: 'tu-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        roleId: 'role-1',
      };

      userRepository.create!.mockReturnValue(newUser);
      userRepository.save!.mockResolvedValue(newUser);
      tenantUserRepository.create!.mockReturnValue(newMembership);
      tenantUserRepository.save!.mockResolvedValue(newMembership);

      const result = await service.create(
        'tenant-1',
        {
          email: 'new@test.com',
          password: 'password123',
          roleId: 'role-1',
        },
        false,
      );

      expect(result.user!.email).toBe('new@test.com');
      expect(userRepository.save).toHaveBeenCalled();
      expect(tenantUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user email already exists', async () => {
      userRepository.findOne!.mockResolvedValue({
        id: 'existing',
        email: 'existing@test.com',
      });

      await expect(
        service.create(
          'tenant-1',
          { email: 'existing@test.com', password: 'pass' },
          false,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if role not found in tenant', async () => {
      userRepository.findOne!.mockResolvedValue(null);
      roleRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.create(
          'tenant-1',
          { email: 'new@test.com', password: 'pass', roleId: 'invalid-role' },
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteExistingUser', () => {
    it('should create membership for existing user', async () => {
      const user = {
        id: 'user-1',
        email: 'existing@test.com',
        isSuperAdmin: false,
      } as UserEntity;
      const role = {
        id: 'role-1',
        name: 'Editor',
        tenantId: 'tenant-1',
      } as RoleEntity;
      const membership = {
        id: 'tu-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        roleId: 'role-1',
      };

      userRepository.findOne!.mockResolvedValue(user);
      roleRepository.findOne!.mockResolvedValue(role);
      tenantUserRepository.findOne!.mockResolvedValue(null); // Not already in tenant
      tenantUserRepository.create!.mockReturnValue(membership);
      tenantUserRepository.save!.mockResolvedValue(membership);

      const result = await service.inviteExistingUser(
        'tenant-1',
        { userId: 'user-1', roleId: 'role-1' },
        false,
      );

      expect(result.user!.email).toBe('existing@test.com');
      expect(tenantUserRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.inviteExistingUser(
          'tenant-1',
          { userId: 'invalid', roleId: 'role-1' },
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is super admin', async () => {
      userRepository.findOne!.mockResolvedValue({
        id: 'user-1',
        isSuperAdmin: true,
      });

      await expect(
        service.inviteExistingUser(
          'tenant-1',
          { userId: 'user-1', roleId: 'role-1' },
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already in tenant', async () => {
      const user = { id: 'user-1', isSuperAdmin: false } as UserEntity;
      const role = { id: 'role-1' } as RoleEntity;

      userRepository.findOne!.mockResolvedValue(user);
      roleRepository.findOne!.mockResolvedValue(role);
      tenantUserRepository.findOne!.mockResolvedValue({ id: 'tu-1' }); // Already exists

      await expect(
        service.inviteExistingUser(
          'tenant-1',
          { userId: 'user-1', roleId: 'role-1' },
          false,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const membership = {
        id: 'tu-1',
        roleId: 'old-role',
      } as unknown as TenantUserEntity;
      const role = { id: 'new-role' } as RoleEntity;

      tenantUserRepository.findOne!.mockResolvedValue(membership);
      roleRepository.findOne!.mockResolvedValue(role);
      tenantUserRepository.save!.mockResolvedValue({
        ...membership,
        roleId: 'new-role',
      });

      await service.updateRole('tenant-1', 'user-1', 'new-role', false);

      expect(tenantUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 'new-role' }),
      );
    });

    it('should allow clearing role (set to null)', async () => {
      const membership = {
        id: 'tu-1',
        roleId: 'old-role',
      } as unknown as TenantUserEntity;

      tenantUserRepository.findOne!.mockResolvedValue(membership);
      tenantUserRepository.save!.mockResolvedValue({
        ...membership,
        roleId: null,
      });

      await service.updateRole('tenant-1', 'user-1', null, false);

      expect(tenantUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: null }),
      );
    });

    it('should throw NotFoundException if membership not found', async () => {
      tenantUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateRole('tenant-1', 'user-1', 'role-1', false),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove membership', async () => {
      const membership = { id: 'tu-1' } as unknown as TenantUserEntity;
      tenantUserRepository.findOne!.mockResolvedValue(membership);
      tenantUserRepository.remove!.mockResolvedValue(membership);

      await service.remove('tenant-1', 'user-1');

      expect(tenantUserRepository.remove).toHaveBeenCalledWith(membership);
    });

    it('should throw NotFoundException if membership not found', async () => {
      tenantUserRepository.findOne!.mockResolvedValue(null);

      await expect(service.remove('tenant-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user profile and role', async () => {
      const membership = {
        id: 'tu-1',
        roleId: 'role-1',
      } as unknown as TenantUserEntity;
      const user = {
        id: 'user-1',
        email: 'old@test.com',
        fullName: 'Old Name',
      } as UserEntity;
      const newRole = { id: 'role-2' } as RoleEntity;

      tenantUserRepository.findOne!.mockResolvedValue(membership);
      userRepository.findOne!.mockResolvedValue(user);
      userRepository.save!.mockResolvedValue({ ...user, fullName: 'New Name' });
      roleRepository.findOne!.mockResolvedValue(newRole);
      tenantUserRepository.save!.mockResolvedValue({
        ...membership,
        roleId: 'role-2',
      });

      const result = await service.updateUser(
        'tenant-1',
        'user-1',
        {
          fullName: 'New Name',
          roleId: 'role-2',
        },
        false,
      );

      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new email already in use', async () => {
      const membership = { id: 'tu-1' } as unknown as TenantUserEntity;
      const user = { id: 'user-1', email: 'old@test.com' } as UserEntity;
      const otherUser = { id: 'user-2', email: 'taken@test.com' } as UserEntity;

      tenantUserRepository.findOne!.mockResolvedValue(membership);
      userRepository
        .findOne!.mockResolvedValueOnce(user) // First call for getting user
        .mockResolvedValueOnce(otherUser); // Second call for email check

      await expect(
        service.updateUser(
          'tenant-1',
          'user-1',
          { email: 'taken@test.com' },
          false,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if membership not found', async () => {
      tenantUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateUser(
          'tenant-1',
          'user-1',
          { fullName: 'New Name' },
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
