import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { DepartmentsService } from './departments.service';
import { DepartmentEntity } from '../../database/entities';
import { TenantCountersService } from '../tenant-counters/tenant-counters.service';
import { DEPARTMENT_ERRORS, DepartmentStatus } from '@gym-monorepo/shared';
import { DepartmentQueryDto } from './dto/department-query.dto';
import * as pagination from '../../common/dto/pagination.dto';

class MockRepository {
  findOne = jest.fn();
  create = jest.fn((entity: DepartmentEntity) => entity);
  save = jest.fn((entity: DepartmentEntity) => Promise.resolve(entity));
  createQueryBuilder = jest.fn();
}

function buildQueryBuilder(items: DepartmentEntity[], total: number) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([items, total]),
  };
}

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let repo: MockRepository;
  let countersService: { getNextDepartmentCode: jest.Mock };

  const tenantId = 'tenant-123';

  beforeEach(async () => {
    repo = new MockRepository();
    countersService = {
      getNextDepartmentCode: jest.fn().mockResolvedValue('DEP-000001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: getRepositoryToken(DepartmentEntity), useValue: repo },
        { provide: TenantCountersService, useValue: countersService },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  describe('findAll', () => {
    it('defaults status to ACTIVE when omitted', async () => {
      const qb = buildQueryBuilder([], 0);
      repo.createQueryBuilder.mockReturnValue(qb);
      jest.spyOn(pagination, 'calculateSkip').mockReturnValue(0);

      const query: DepartmentQueryDto = {
        page: 1,
        limit: 10,
        status: DepartmentStatus.ACTIVE,
      };
      await service.findAll(tenantId, query);

      expect(qb.where).toHaveBeenCalledWith('department.tenantId = :tenantId', {
        tenantId,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('department.status = :status', {
        status: DepartmentStatus.ACTIVE,
      });
    });

    it('filters by status/search and paginates using calculateSkip', async () => {
      const items: DepartmentEntity[] = [
        {
          id: '1',
          tenantId,
          code: 'DEP-000001',
          name: 'IT',
          status: DepartmentStatus.ACTIVE,
        } as DepartmentEntity,
      ];
      const total = 1;
      const qb = buildQueryBuilder(items, total);
      repo.createQueryBuilder.mockReturnValue(qb);
      jest.spyOn(pagination, 'calculateSkip').mockReturnValue(0);
      jest.spyOn(pagination, 'paginate').mockReturnValue({
        items,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const query: DepartmentQueryDto = {
        page: 1,
        limit: 10,
        search: 'IT',
        status: DepartmentStatus.ACTIVE,
      };
      const result = await service.findAll(tenantId, query);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(department.code ILIKE :search OR department.name ILIKE :search)',
        { search: '%IT%' },
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException with Department error when missing', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(tenantId, 'missing-id')).rejects.toThrow(
        DEPARTMENT_ERRORS.NOT_FOUND.message,
      );
    });
  });

  describe('create', () => {
    it('generates code server-side and creates department', async () => {
      repo.findOne.mockResolvedValue(null); // No duplicate
      const created = {
        id: 'new-id',
        tenantId,
        code: 'DEP-000001',
        name: 'HR',
        status: DepartmentStatus.ACTIVE,
      } as DepartmentEntity;
      repo.save.mockResolvedValue(created);

      const result = await service.create(tenantId, { name: 'HR' });

      expect(countersService.getNextDepartmentCode).toHaveBeenCalledWith(
        tenantId,
      );
      expect(repo.create).toHaveBeenCalledWith({
        tenantId,
        code: 'DEP-000001',
        name: 'HR',
        status: DepartmentStatus.ACTIVE,
      });
      expect(result.name).toBe('HR');
    });

    it('rejects duplicate name with Department error', async () => {
      repo.findOne.mockResolvedValue({
        id: 'existing-id',
        tenantId,
        name: 'HR',
      });

      await expect(service.create(tenantId, { name: 'HR' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(tenantId, { name: 'HR' })).rejects.toThrow(
        DEPARTMENT_ERRORS.DUPLICATE_NAME.message,
      );
    });
  });

  describe('update', () => {
    it('updates name and status', async () => {
      const existing = {
        id: 'dept-1',
        tenantId,
        code: 'DEP-000001',
        name: 'IT',
        status: DepartmentStatus.ACTIVE,
      } as DepartmentEntity;
      repo.findOne
        .mockResolvedValueOnce(existing) // findOne
        .mockResolvedValueOnce(null); // assertNameUnique

      const result = await service.update(tenantId, 'dept-1', {
        name: 'Information Technology',
        status: DepartmentStatus.INACTIVE,
      });

      expect(result.name).toBe('Information Technology');
      expect(result.status).toBe(DepartmentStatus.INACTIVE);
    });

    it('rejects duplicate name on update with excludeId', async () => {
      const existing = {
        id: 'dept-1',
        tenantId,
        code: 'DEP-000001',
        name: 'IT',
        status: DepartmentStatus.ACTIVE,
      } as DepartmentEntity;
      const conflict = {
        id: 'dept-2',
        tenantId,
        name: 'HR',
      };
      repo.findOne
        .mockResolvedValueOnce(existing) // findOne
        .mockResolvedValueOnce(conflict); // assertNameUnique - conflict found

      await expect(
        service.update(tenantId, 'dept-1', { name: 'HR' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('soft deletes by setting status to INACTIVE', async () => {
      const existing = {
        id: 'dept-1',
        tenantId,
        code: 'DEP-000001',
        name: 'IT',
        status: DepartmentStatus.ACTIVE,
      } as DepartmentEntity;
      repo.findOne.mockResolvedValue(existing);

      await service.remove(tenantId, 'dept-1');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: DepartmentStatus.INACTIVE }),
      );
    });
  });
});
