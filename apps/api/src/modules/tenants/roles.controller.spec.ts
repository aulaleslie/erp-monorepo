import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: Partial<RolesService>;

  beforeEach(async () => {
    rolesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getPermissionsForRole: jest.fn(),
      getAssignedUsers: jest.fn(),
      assignPermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: rolesService },
        { provide: Reflector, useValue: {} },
      ],
    })
      .overrideGuard(require('@nestjs/passport').AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(require('./guards/active-tenant.guard').ActiveTenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(
        require('./guards/tenant-membership.guard').TenantMembershipGuard,
      )
      .useValue({ canActivate: () => true })
      .overrideGuard(
        require('../users/guards/permission.guard').PermissionGuard,
      )
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RolesController>(RolesController);
  });

  describe('findAll', () => {
    it('should return paginated roles', async () => {
      const paginatedResult = {
        items: [{ id: 'role-1', name: 'Editor' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      (rolesService.findAll as jest.Mock).mockResolvedValue(paginatedResult);

      const mockReq = { tenantId: 'tenant-1' };
      const result = await controller.findAll(mockReq, 1, 10);

      expect(result).toEqual(paginatedResult);
      expect(rolesService.findAll).toHaveBeenCalledWith('tenant-1', 1, 10);
    });
  });

  describe('findOne', () => {
    it('should return role with permissions', async () => {
      const role = { id: 'role-1', name: 'Editor' };
      const permissions = ['users.read', 'users.write'];

      (rolesService.findOne as jest.Mock).mockResolvedValue(role);
      (rolesService.getPermissionsForRole as jest.Mock).mockResolvedValue(
        permissions,
      );

      const mockReq = { tenantId: 'tenant-1' };
      const result = await controller.findOne(mockReq, 'role-1');

      expect(result).toEqual({ ...role, permissions });
    });
  });

  describe('getAssignedUsers', () => {
    it('should return users assigned to role', async () => {
      const users = [{ id: 'user-1', email: 'test@test.com' }];
      (rolesService.getAssignedUsers as jest.Mock).mockResolvedValue(users);

      const mockReq = { tenantId: 'tenant-1' };
      const result = await controller.getAssignedUsers(mockReq, 'role-1');

      expect(result).toEqual(users);
    });
  });

  describe('create', () => {
    it('should create role with permissions', async () => {
      const newRole = { id: 'role-1', name: 'New Role' };
      (rolesService.create as jest.Mock).mockResolvedValue(newRole);
      (rolesService.assignPermissions as jest.Mock).mockResolvedValue(
        undefined,
      );

      const mockReq = { tenantId: 'tenant-1', user: { isSuperAdmin: false } };
      const result = await controller.create(mockReq, {
        name: 'New Role',
        permissions: ['users.read'],
      });

      expect(result).toEqual(newRole);
      expect(rolesService.assignPermissions).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no permissions and not super admin', async () => {
      const mockReq = { tenantId: 'tenant-1', user: { isSuperAdmin: false } };

      await expect(
        controller.create(mockReq, { name: 'New Role', permissions: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow creating super admin role without permissions', async () => {
      const newRole = { id: 'role-1', name: 'Super Admin', isSuperAdmin: true };
      (rolesService.create as jest.Mock).mockResolvedValue(newRole);

      const mockReq = { tenantId: 'tenant-1', user: { isSuperAdmin: true } };
      const result = await controller.create(mockReq, {
        name: 'Super Admin',
        isSuperAdmin: true,
      });

      expect(result).toEqual(newRole);
    });

    it('should forbid non-super admin from creating super admin role', async () => {
      const mockReq = { tenantId: 'tenant-1', user: { isSuperAdmin: false } };

      await expect(
        controller.create(mockReq, {
          name: 'Super Admin',
          isSuperAdmin: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update role and assign new permissions', async () => {
      const updatedRole = { id: 'role-1', name: 'Updated Role' };
      (rolesService.update as jest.Mock).mockResolvedValue(updatedRole);
      (rolesService.assignPermissions as jest.Mock).mockResolvedValue(
        undefined,
      );

      const mockReq = { tenantId: 'tenant-1' };
      const result = await controller.update(mockReq, 'role-1', {
        name: 'Updated Role',
        permissions: ['users.read', 'users.write'],
      });

      expect(result).toEqual(updatedRole);
      expect(rolesService.assignPermissions).toHaveBeenCalledWith(
        'tenant-1',
        'role-1',
        ['users.read', 'users.write'],
      );
    });
  });

  describe('delete', () => {
    it('should delete role', async () => {
      (rolesService.delete as jest.Mock).mockResolvedValue(undefined);

      const mockReq = { tenantId: 'tenant-1' };
      await controller.delete(mockReq, 'role-1');

      expect(rolesService.delete).toHaveBeenCalledWith('tenant-1', 'role-1');
    });
  });
});
