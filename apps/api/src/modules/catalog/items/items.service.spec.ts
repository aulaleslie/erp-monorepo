import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { ItemsService } from './items.service';
import {
  ItemDurationUnit,
  ItemEntity,
  ItemServiceKind,
  ItemStatus,
  ItemType,
} from '../../../database/entities/item.entity';
import { CategoryEntity } from '../../../database/entities/category.entity';
import { TenantCountersService } from '../../tenant-counters/tenant-counters.service';
import { StorageService } from '../../storage/storage.service';
import { ITEM_ERRORS } from '@gym-monorepo/shared';
import { CreateItemDto } from './dto/create-item.dto';
import * as pagination from '../../../common/dto/pagination.dto';

class MockRepository {
  findOne = jest.fn();
  create = jest.fn((entity: ItemEntity) => entity);
  save = jest.fn((entity: ItemEntity) => Promise.resolve(entity));
  createQueryBuilder = jest.fn();
}

function buildQueryBuilder(items: ItemEntity[], total: number) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([items, total]),
  };
}

describe('ItemsService', () => {
  let service: ItemsService;
  let itemRepo: MockRepository;
  let categoryRepo: MockRepository;
  let countersService: { getNextItemCode: jest.Mock };
  let storageService: {
    validateFile: jest.Mock;
    generateObjectKey: jest.Mock;
    uploadFile: jest.Mock;
    deleteFile: jest.Mock;
  };

  const tenantId = 'tenant-123';

  beforeEach(async () => {
    itemRepo = new MockRepository();
    categoryRepo = new MockRepository();
    countersService = {
      getNextItemCode: jest.fn().mockResolvedValue('SKU-000001'),
    };
    storageService = {
      validateFile: jest.fn(),
      generateObjectKey: jest.fn().mockReturnValue('items/tenant-123/uuid.jpg'),
      uploadFile: jest
        .fn()
        .mockResolvedValue('http://minio/bucket/items/tenant-123/uuid.jpg'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: getRepositoryToken(ItemEntity), useValue: itemRepo },
        { provide: getRepositoryToken(CategoryEntity), useValue: categoryRepo },
        { provide: TenantCountersService, useValue: countersService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  describe('create', () => {
    it('generates code server-side and creates a product', async () => {
      const dto: CreateItemDto = {
        name: 'Protein Powder',
        type: ItemType.PRODUCT,
        price: 250000,
      };

      itemRepo.findOne.mockResolvedValue(null); // No duplicate barcode
      itemRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-id' }),
      );

      const result = await service.create(dto, tenantId);

      expect(countersService.getNextItemCode).toHaveBeenCalledWith(tenantId);
      expect(itemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          code: 'SKU-000001',
          name: 'Protein Powder',
          type: ItemType.PRODUCT,
          price: 250000,
          status: ItemStatus.ACTIVE,
        }),
      );
      expect(result.code).toBe('SKU-000001');
    });

    it('creates a membership service with duration', async () => {
      const dto: CreateItemDto = {
        name: 'Monthly Membership',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.MEMBERSHIP,
        price: 500000,
        durationValue: 30,
        durationUnit: ItemDurationUnit.DAY,
      };

      itemRepo.findOne.mockResolvedValue(null);
      itemRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-id' }),
      );

      const result = await service.create(dto, tenantId);

      expect(itemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceKind: ItemServiceKind.MEMBERSHIP,
          durationValue: 30,
          durationUnit: ItemDurationUnit.DAY,
        }),
      );
      expect(result.serviceKind).toBe(ItemServiceKind.MEMBERSHIP);
    });

    it('creates a PT session service with session count', async () => {
      const dto: CreateItemDto = {
        name: 'PT Package 12 Sessions',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.PT_SESSION,
        price: 1800000,
        durationValue: 90,
        durationUnit: ItemDurationUnit.DAY,
        sessionCount: 12,
      };

      itemRepo.findOne.mockResolvedValue(null);
      itemRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'new-id' }),
      );

      const result = await service.create(dto, tenantId);

      expect(itemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceKind: ItemServiceKind.PT_SESSION,
          sessionCount: 12,
        }),
      );
      expect(result.sessionCount).toBe(12);
    });

    it('validates category exists when provided', async () => {
      const dto: CreateItemDto = {
        name: 'Protein Powder',
        type: ItemType.PRODUCT,
        price: 250000,
        categoryId: 'cat-123',
      };

      categoryRepo.findOne.mockResolvedValue(null); // Category not found

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects PRODUCT with service fields', async () => {
      const dto: CreateItemDto = {
        name: 'Invalid Product',
        type: ItemType.PRODUCT,
        price: 100000,
        serviceKind: ItemServiceKind.MEMBERSHIP, // Invalid for PRODUCT
      };

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects SERVICE without serviceKind', async () => {
      const dto = {
        name: 'Invalid Service',
        type: ItemType.SERVICE,
        price: 100000,
        // missing serviceKind
      } as CreateItemDto;

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects MEMBERSHIP without duration fields', async () => {
      const dto: CreateItemDto = {
        name: 'Invalid Membership',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.MEMBERSHIP,
        price: 500000,
        // missing durationValue and durationUnit
      };

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects PT_SESSION without sessionCount', async () => {
      const dto: CreateItemDto = {
        name: 'Invalid PT Session',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.PT_SESSION,
        price: 150000,
        durationValue: 30,
        durationUnit: ItemDurationUnit.DAY,
        // missing sessionCount
      };

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate barcode', async () => {
      const dto: CreateItemDto = {
        name: 'Product with Barcode',
        type: ItemType.PRODUCT,
        price: 50000,
        barcode: '1234567890',
      };

      itemRepo.findOne.mockResolvedValue({
        id: 'existing',
        barcode: '1234567890',
      });

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dto, tenantId)).rejects.toThrow(
        ITEM_ERRORS.DUPLICATE_BARCODE.message,
      );
    });
  });

  describe('findAll', () => {
    it('filters by type and paginates', async () => {
      const items: ItemEntity[] = [
        {
          id: '1',
          tenantId,
          code: 'SKU-000001',
          name: 'Monthly Membership',
          type: ItemType.SERVICE,
          serviceKind: ItemServiceKind.MEMBERSHIP,
          price: 500000,
          status: ItemStatus.ACTIVE,
        } as ItemEntity,
      ];
      const total = 1;
      const qb = buildQueryBuilder(items, total);
      itemRepo.createQueryBuilder.mockReturnValue(qb);
      jest.spyOn(pagination, 'calculateSkip').mockReturnValue(0);
      jest.spyOn(pagination, 'paginate').mockReturnValue({
        items,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await service.findAll(
        { page: 1, limit: 10, type: ItemType.SERVICE },
        tenantId,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('item.type = :type', {
        type: ItemType.SERVICE,
      });
      expect(result.items).toHaveLength(1);
    });

    it('searches by code, name, barcode, tags', async () => {
      const qb = buildQueryBuilder([], 0);
      itemRepo.createQueryBuilder.mockReturnValue(qb);
      jest.spyOn(pagination, 'calculateSkip').mockReturnValue(0);
      jest.spyOn(pagination, 'paginate').mockReturnValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await service.findAll(
        { page: 1, limit: 10, search: 'protein' },
        tenantId,
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(item.code ILIKE :search OR item.name ILIKE :search OR item.barcode ILIKE :search OR item.tags::text ILIKE :search)',
        { search: '%protein%' },
      );
    });
  });

  describe('findOne', () => {
    it('returns item when found', async () => {
      const item = {
        id: 'item-1',
        tenantId,
        name: 'Test Item',
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(item);

      const result = await service.findOne('item-1', tenantId);

      expect(result).toEqual(item);
    });

    it('throws NotFoundException when not found', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id', tenantId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing-id', tenantId)).rejects.toThrow(
        ITEM_ERRORS.NOT_FOUND.message,
      );
    });
  });

  describe('update', () => {
    it('updates item fields', async () => {
      const existing = {
        id: 'item-1',
        tenantId,
        code: 'SKU-000001',
        name: 'Old Name',
        type: ItemType.PRODUCT,
        price: 100000,
        status: ItemStatus.ACTIVE,
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(existing);

      const result = await service.update(
        'item-1',
        { name: 'New Name', price: 120000 },
        tenantId,
      );

      expect(result.name).toBe('New Name');
      expect(result.price).toBe(120000);
    });

    it('rejects duplicate barcode on update', async () => {
      const existing = {
        id: 'item-1',
        tenantId,
        code: 'SKU-000001',
        name: 'Item 1',
        type: ItemType.PRODUCT,
        price: 100000,
        barcode: null,
      } as ItemEntity;
      itemRepo.findOne
        .mockResolvedValueOnce(existing) // findOne
        .mockResolvedValueOnce({ id: 'item-2', barcode: '123456' }); // assertBarcodeUnique

      await expect(
        service.update('item-1', { barcode: '123456' }, tenantId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('soft deletes by setting status to INACTIVE', async () => {
      const existing = {
        id: 'item-1',
        tenantId,
        code: 'SKU-000001',
        name: 'Test Item',
        type: ItemType.PRODUCT,
        price: 100000,
        status: ItemStatus.ACTIVE,
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(existing);

      await service.remove('item-1', tenantId);

      expect(itemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ItemStatus.INACTIVE }),
      );
    });
  });

  describe('uploadImage', () => {
    const mockFile = {
      buffer: Buffer.from('test image'),
      mimetype: 'image/jpeg',
      filename: 'test.jpg',
      size: 1000,
    };

    it('uploads image and updates item fields', async () => {
      const existing = {
        id: 'item-1',
        tenantId,
        code: 'SKU-000001',
        name: 'Test Item',
        type: ItemType.PRODUCT,
        price: 100000,
        status: ItemStatus.ACTIVE,
        imageKey: null,
        imageUrl: null,
        imageMimeType: null,
        imageSize: null,
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(existing);

      const result = await service.uploadImage('item-1', tenantId, mockFile);

      expect(storageService.validateFile).toHaveBeenCalledWith(
        'image/jpeg',
        1000,
      );
      expect(storageService.generateObjectKey).toHaveBeenCalledWith(
        `items/${tenantId}`,
        'test.jpg',
      );
      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(itemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          imageKey: 'items/tenant-123/uuid.jpg',
          imageUrl: 'http://minio/bucket/items/tenant-123/uuid.jpg',
          imageMimeType: 'image/jpeg',
          imageSize: 1000,
        }),
      );
      expect(result.imageKey).toBe('items/tenant-123/uuid.jpg');
    });

    it('deletes old image when replacing', async () => {
      const existing = {
        id: 'item-1',
        tenantId,
        code: 'SKU-000001',
        name: 'Test Item',
        type: ItemType.PRODUCT,
        price: 100000,
        status: ItemStatus.ACTIVE,
        imageKey: 'items/tenant-123/old-image.jpg',
        imageUrl: 'http://minio/bucket/items/tenant-123/old-image.jpg',
        imageMimeType: 'image/jpeg',
        imageSize: 500,
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(existing);

      await service.uploadImage('item-1', tenantId, mockFile);

      expect(storageService.deleteFile).toHaveBeenCalledWith(
        'items/tenant-123/old-image.jpg',
      );
    });

    it('throws NotFoundException when item not found', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      await expect(
        service.uploadImage('missing-id', tenantId, mockFile),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates validation errors from StorageService', async () => {
      const existing = {
        id: 'item-1',
        tenantId,
        code: 'SKU-000001',
        name: 'Test Item',
        type: ItemType.PRODUCT,
        price: 100000,
        status: ItemStatus.ACTIVE,
        imageKey: null,
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(existing);
      storageService.validateFile.mockImplementation(() => {
        throw new BadRequestException('File too large');
      });

      await expect(
        service.uploadImage('item-1', tenantId, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
