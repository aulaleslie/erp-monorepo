import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CategoriesService } from './categories.service';
import {
  CategoryEntity,
  CategoryStatus,
} from '../../../database/entities/category.entity';
import { TenantCountersService } from '../../tenant-counters/tenant-counters.service';

class MockRepository {
  findOne = jest.fn();
  create = jest.fn((entity: CategoryEntity) => entity);
  save = jest.fn((entity: CategoryEntity) => Promise.resolve(entity));
  createQueryBuilder = jest.fn();
}

function buildQueryBuilder(items: CategoryEntity[], total: number) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([items, total]),
  };
}

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: MockRepository;
  let countersService: { getNextCategoryCode: jest.Mock };

  const tenantId = 'tenant-123';

  beforeEach(async () => {
    categoryRepo = new MockRepository();
    countersService = {
      getNextCategoryCode: jest.fn().mockResolvedValue('CAT-000001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(CategoryEntity), useValue: categoryRepo },
        { provide: TenantCountersService, useValue: countersService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('creates a root category with auto-generated code', async () => {
      categoryRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-id' }),
      );

      const result = await service.create({ name: 'Supplements' }, tenantId);

      expect(countersService.getNextCategoryCode).toHaveBeenCalledWith(
        tenantId,
      );
      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          code: 'CAT-000001',
          name: 'Supplements',
        }),
      );
      expect(result.code).toBe('CAT-000001');
    });

    it('creates a child category with valid parent', async () => {
      const parent = {
        id: 'parent-1',
        tenantId,
        name: 'Services',
        parentId: null,
      } as CategoryEntity;

      categoryRepo.findOne.mockResolvedValue(parent);
      categoryRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-id' }),
      );

      const result = await service.create(
        { name: 'Personal Training', parentId: 'parent-1' },
        tenantId,
      );

      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Personal Training',
          parentId: 'parent-1',
        }),
      );
      expect(result.code).toBe('CAT-000001');
    });

    it('throws NotFoundException when parent does not exist', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          { name: 'Invalid Child', parentId: 'missing-parent' },
          tenantId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects creating a grandchild (depth > 2 levels)', async () => {
      const childParent = {
        id: 'child-parent',
        tenantId,
        name: 'Already a Child',
        parentId: 'grandparent-id', // Already has a parent
      } as CategoryEntity;

      categoryRepo.findOne.mockResolvedValue(childParent);

      await expect(
        service.create(
          { name: 'Grandchild', parentId: 'child-parent' },
          tenantId,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(
          { name: 'Grandchild', parentId: 'child-parent' },
          tenantId,
        ),
      ).rejects.toThrow('Tree depth max 2 levels (root + one child)');
    });
  });

  describe('findAll', () => {
    it('returns paginated categories', async () => {
      const categories: CategoryEntity[] = [
        {
          id: '1',
          tenantId,
          code: 'CAT-000001',
          name: 'Memberships',
          status: CategoryStatus.ACTIVE,
        } as CategoryEntity,
      ];
      const total = 1;
      const qb = buildQueryBuilder(categories, total);
      categoryRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 }, tenantId);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('filters by status', async () => {
      const qb = buildQueryBuilder([], 0);
      categoryRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(
        { page: 1, limit: 10, status: CategoryStatus.ACTIVE },
        tenantId,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('category.status = :status', {
        status: CategoryStatus.ACTIVE,
      });
    });

    it('filters by parentId', async () => {
      const qb = buildQueryBuilder([], 0);
      categoryRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(
        { page: 1, limit: 10, parentId: 'parent-123' },
        tenantId,
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        'category.parentId = :parentId',
        { parentId: 'parent-123' },
      );
    });

    it('searches by name and code', async () => {
      const qb = buildQueryBuilder([], 0);
      categoryRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, search: 'member' }, tenantId);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(category.name ILIKE :search OR category.code ILIKE :search)',
        { search: '%member%' },
      );
    });
  });

  describe('findOne', () => {
    it('returns category when found', async () => {
      const category = {
        id: 'cat-1',
        tenantId,
        name: 'Test Category',
      } as CategoryEntity;
      categoryRepo.findOne.mockResolvedValue(category);

      const result = await service.findOne('cat-1', tenantId);

      expect(result).toEqual(category);
    });

    it('throws NotFoundException when not found', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id', tenantId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing-id', tenantId)).rejects.toThrow(
        'Category not found',
      );
    });
  });

  describe('update', () => {
    it('updates category fields', async () => {
      const existing = {
        id: 'cat-1',
        tenantId,
        code: 'CAT-000001',
        name: 'Old Name',
        status: CategoryStatus.ACTIVE,
      } as CategoryEntity;
      // First call: findOne for the category being updated
      // Second call: duplicate name check (returns null = no duplicate)
      categoryRepo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(null);

      const result = await service.update(
        'cat-1',
        { name: 'New Name' },
        tenantId,
      );

      expect(result.name).toBe('New Name');
    });

    it('rejects duplicate name within tenant', async () => {
      const existing = {
        id: 'cat-1',
        tenantId,
        code: 'CAT-000001',
        name: 'Original',
        status: CategoryStatus.ACTIVE,
      } as CategoryEntity;
      // Mock needs to be reset for each expect statement
      categoryRepo.findOne
        .mockResolvedValueOnce(existing) // findOne for the category being updated
        .mockResolvedValueOnce({ id: 'cat-2', name: 'Duplicate Name' }) // duplicate check
        .mockResolvedValueOnce(existing) // findOne for second expect call
        .mockResolvedValueOnce({ id: 'cat-2', name: 'Duplicate Name' }); // duplicate check for second call

      await expect(
        service.update('cat-1', { name: 'Duplicate Name' }, tenantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('cat-1', { name: 'Duplicate Name' }, tenantId),
      ).rejects.toThrow('Category with this name already exists');
    });

    it('rejects changing parent to a category that is itself a child (depth rule)', async () => {
      const existing = {
        id: 'cat-1',
        tenantId,
        name: 'Category',
        parentId: null,
      } as CategoryEntity;
      const invalidParent = {
        id: 'cat-child',
        tenantId,
        name: 'Child Category',
        parentId: 'some-parent', // Already a child
      } as CategoryEntity;

      // Mock needs to handle two expect calls
      categoryRepo.findOne
        .mockResolvedValueOnce(existing) // findOne for the category being updated
        .mockResolvedValueOnce(invalidParent) // parent lookup
        .mockResolvedValueOnce(existing) // findOne for second expect call
        .mockResolvedValueOnce(invalidParent); // parent lookup for second call

      await expect(
        service.update('cat-1', { parentId: 'cat-child' }, tenantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('cat-1', { parentId: 'cat-child' }, tenantId),
      ).rejects.toThrow('Tree depth max 2 levels (root + one child)');
    });

    it('rejects self-parenting', async () => {
      const existing = {
        id: 'cat-1',
        tenantId,
        name: 'Category',
        parentId: null,
      } as CategoryEntity;
      const selfParent = {
        id: 'cat-1',
        tenantId,
        name: 'Category',
        parentId: null,
      } as CategoryEntity;

      // Mock needs to handle two expect calls
      categoryRepo.findOne
        .mockResolvedValueOnce(existing) // findOne for the category being updated
        .mockResolvedValueOnce(selfParent) // parent lookup (returns itself)
        .mockResolvedValueOnce(existing) // findOne for second expect call
        .mockResolvedValueOnce(selfParent); // parent lookup for second call

      await expect(
        service.update('cat-1', { parentId: 'cat-1' }, tenantId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('cat-1', { parentId: 'cat-1' }, tenantId),
      ).rejects.toThrow('Category cannot be its own parent');
    });

    it('throws NotFoundException when updating non-existent parent', async () => {
      const existing = {
        id: 'cat-1',
        tenantId,
        name: 'Category',
        parentId: null,
      } as CategoryEntity;

      categoryRepo.findOne
        .mockResolvedValueOnce(existing) // findOne for the category being updated
        .mockResolvedValueOnce(null); // parent not found

      await expect(
        service.update('cat-1', { parentId: 'missing-parent' }, tenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft deletes by setting status to INACTIVE', async () => {
      const existing = {
        id: 'cat-1',
        tenantId,
        code: 'CAT-000001',
        name: 'Category to Delete',
        status: CategoryStatus.ACTIVE,
      } as CategoryEntity;
      categoryRepo.findOne.mockResolvedValue(existing);

      await service.remove('cat-1', tenantId);

      expect(categoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CategoryStatus.INACTIVE }),
      );
    });
  });
});
