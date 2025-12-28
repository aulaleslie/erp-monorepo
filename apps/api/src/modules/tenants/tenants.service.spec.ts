import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { Repository, ObjectLiteral } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepository: MockRepository<TenantEntity>;
  let tenantUserRepository: MockRepository<TenantUserEntity>;
  let roleRepository: MockRepository<RoleEntity>;

  beforeEach(async () => {
    tenantRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    tenantUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    roleRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: tenantRepository,
        },
        {
          provide: getRepositoryToken(TenantUserEntity),
          useValue: tenantUserRepository,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: roleRepository,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  describe('getMyTenants', () => {
    it('should return empty array if no memberships', async () => {
      tenantUserRepository.find!.mockResolvedValue([]);

      const result = await service.getMyTenants('user-1');
      expect(result).toEqual([]);
    });

    it('should return tenants for user memberships', async () => {
      const memberships = [{ tenantId: 'tenant-1' }, { tenantId: 'tenant-2' }];
      const tenants = [
        { id: 'tenant-1', name: 'Tenant 1', status: 'ACTIVE' },
        { id: 'tenant-2', name: 'Tenant 2', status: 'ACTIVE' },
      ] as TenantEntity[];

      tenantUserRepository.find!.mockResolvedValue(memberships);
      tenantRepository.find!.mockResolvedValue(tenants);

      const result = await service.getMyTenants('user-1');
      expect(result).toEqual(tenants);
      expect(tenantRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything(), status: 'ACTIVE' },
      });
    });
  });

  describe('validateTenantAccess', () => {
    it('should return true if user has membership', async () => {
      tenantUserRepository.findOne!.mockResolvedValue({ userId: 'user-1', tenantId: 'tenant-1' });

      const result = await service.validateTenantAccess('user-1', 'tenant-1');
      expect(result).toBe(true);
    });

    it('should return false if user has no membership', async () => {
      tenantUserRepository.findOne!.mockResolvedValue(null);

      const result = await service.validateTenantAccess('user-1', 'tenant-1');
      expect(result).toBe(false);
    });
  });

  describe('getTenantById', () => {
    it('should return tenant if found', async () => {
      const tenant = { id: 'tenant-1', name: 'Test Tenant' } as TenantEntity;
      tenantRepository.findOne!.mockResolvedValue(tenant);

      const result = await service.getTenantById('tenant-1');
      expect(result).toEqual(tenant);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      tenantRepository.findOne!.mockResolvedValue(null);

      await expect(service.getTenantById('tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create tenant with Super Admin role', async () => {
      tenantRepository.findOne!.mockResolvedValue(null); // No existing slug/name
      const newTenant = { id: 'new-tenant', name: 'New Tenant', slug: 'new-tenant' };
      const newRole = { id: 'role-1', name: 'Super Admin', isSuperAdmin: true };
      
      tenantRepository.create!.mockReturnValue(newTenant);
      tenantRepository.save!.mockResolvedValue(newTenant);
      roleRepository.create!.mockReturnValue(newRole);
      roleRepository.save!.mockResolvedValue(newRole);
      tenantUserRepository.create!.mockReturnValue({});
      tenantUserRepository.save!.mockResolvedValue({});

      const result = await service.create('user-1', { name: 'New Tenant', slug: 'new-tenant' });

      expect(result).toEqual(newTenant);
      expect(roleRepository.create).toHaveBeenCalledWith({
        tenantId: 'new-tenant',
        name: 'Super Admin',
        isSuperAdmin: true,
      });
    });

    it('should throw BadRequestException if slug already exists', async () => {
      tenantRepository.findOne!.mockResolvedValueOnce({ slug: 'existing-slug' }); // Slug exists

      await expect(
        service.create('user-1', { name: 'New Tenant', slug: 'existing-slug' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const tenants = [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ] as TenantEntity[];
      
      tenantRepository.findAndCount!.mockResolvedValue([tenants, 25]);

      const result = await service.findAll(1, 10);

      expect(result.items).toEqual(tenants);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('delete', () => {
    it('should soft delete by setting status to DISABLED', async () => {
      const tenant = { id: 'tenant-1', name: 'Test', status: 'ACTIVE' } as TenantEntity;
      tenantRepository.findOne!.mockResolvedValue(tenant);
      tenantRepository.save!.mockResolvedValue({ ...tenant, status: 'DISABLED' });

      await service.delete('tenant-1');

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DISABLED' })
      );
    });
  });
});
