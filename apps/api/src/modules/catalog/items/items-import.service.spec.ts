import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { ItemsImportService } from './items-import.service';
import { ItemsService } from './items.service';
import {
  ItemDurationUnit,
  ItemEntity,
  ItemServiceKind,
  ItemType,
} from '../../../database/entities/item.entity';
import {
  CategoryEntity,
  CategoryStatus,
} from '../../../database/entities/category.entity';
import { TenantCountersService } from '../../tenant-counters/tenant-counters.service';
import { StorageService } from '../../storage/storage.service';
import { IMPORT_ERRORS, CATEGORY_ERRORS } from '@gym-monorepo/shared';
import { CreateItemDto } from './dto/create-item.dto';
import { TagsService } from '../../tags/tags.service';

class MockRepository<T extends object> {
  findOne = jest.fn();
  create = jest.fn((entity: T) => entity);
  save = jest.fn((entity: T) => Promise.resolve({ id: 'new-id', ...entity }));
}

describe('ItemsImportService', () => {
  let service: ItemsImportService;
  let itemRepo: MockRepository<ItemEntity>;
  let categoryRepo: MockRepository<CategoryEntity>;
  let countersService: {
    getNextItemCode: jest.Mock;
    getNextCategoryCode: jest.Mock;
  };
  let storageService: {
    isConfigured: jest.Mock;
    deleteFile: jest.Mock;
    downloadAndStoreFromUrl: jest.Mock;
  };
  let itemsService: {
    create: jest.Mock<Promise<ItemEntity>, [CreateItemDto, string]>;
    validateServiceFields: jest.Mock;
  };
  let tagsService: { assign: jest.Mock };

  const tenantId = 'tenant-123';

  beforeEach(async () => {
    itemRepo = new MockRepository<ItemEntity>();
    categoryRepo = new MockRepository<CategoryEntity>();
    countersService = {
      getNextItemCode: jest.fn().mockResolvedValue('SKU-000001'),
      getNextCategoryCode: jest.fn().mockResolvedValue('CAT-000001'),
    };
    storageService = {
      isConfigured: jest.fn().mockReturnValue(true),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      downloadAndStoreFromUrl: jest.fn().mockResolvedValue({
        imageKey: 'items/tenant-123/uuid.jpg',
        imageUrl: 'http://minio/bucket/items/tenant-123/uuid.jpg',
        imageMimeType: 'image/jpeg',
        imageSize: 5000,
      }),
    };
    itemsService = {
      create: jest
        .fn<Promise<ItemEntity>, [CreateItemDto, string]>()
        .mockImplementation((dto, tenantId) =>
          Promise.resolve({
            id: 'item-id',
            tenantId,
            code: 'SKU-000001',
            ...dto,
          } as ItemEntity),
        ),
      validateServiceFields: jest.fn(),
    };
    tagsService = {
      assign: jest.fn().mockResolvedValue({ assigned: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsImportService,
        { provide: getRepositoryToken(ItemEntity), useValue: itemRepo },
        { provide: getRepositoryToken(CategoryEntity), useValue: categoryRepo },
        { provide: TenantCountersService, useValue: countersService },
        { provide: StorageService, useValue: storageService },
        { provide: ItemsService, useValue: itemsService },
        { provide: TagsService, useValue: tagsService },
      ],
    }).compile();

    service = module.get<ItemsImportService>(ItemsImportService);
  });

  describe('importItems', () => {
    const createCsvBuffer = (rows: string[]): Buffer => {
      return Buffer.from(rows.join('\n'));
    };

    it('throws when file has no data rows', async () => {
      const file = {
        buffer: createCsvBuffer(['name,type,price']),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      await expect(service.importItems(tenantId, file)).rejects.toThrow(
        'No data rows found in file',
      );
    });

    it('throws when required columns are missing', async () => {
      const file = {
        buffer: createCsvBuffer(['name,type', 'Product A,PRODUCT']),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      await expect(service.importItems(tenantId, file)).rejects.toThrow(
        IMPORT_ERRORS.MISSING_REQUIRED_COLUMN.message,
      );
    });

    it('imports valid CSV rows successfully', async () => {
      itemRepo.findOne.mockResolvedValue(null); // No existing item

      const file = {
        buffer: createCsvBuffer([
          'name,type,price',
          'Protein Powder,PRODUCT,250000',
        ]),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(itemsService.create).toHaveBeenCalled();
    });

    it('reports validation errors for invalid row data', async () => {
      const file = {
        buffer: createCsvBuffer([
          'name,type,price',
          'Invalid Item,INVALID_TYPE,not-a-number',
        ]),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.results[0].error).toContain(
        IMPORT_ERRORS.INVALID_ROW_DATA.message,
      );
    });

    it('throws for unsupported file types', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
        filename: 'items.pdf',
      };

      await expect(service.importItems(tenantId, file)).rejects.toThrow(
        IMPORT_ERRORS.INVALID_FILE_FORMAT.message,
      );
    });

    it('updates existing item (upsert behavior)', async () => {
      const existingItem = {
        id: 'existing-id',
        tenantId,
        name: 'Protein Powder',
        type: ItemType.PRODUCT,
        code: 'SKU-000001',
        price: 200000,
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(existingItem);

      const file = {
        buffer: createCsvBuffer([
          'name,type,price',
          'Protein Powder,PRODUCT,250000',
        ]),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      expect(result.successCount).toBe(1);
      expect(itemRepo.save).toHaveBeenCalled();
      expect(itemsService.create).not.toHaveBeenCalled();
    });
  });

  describe('category auto-creation', () => {
    it('creates category when not found', async () => {
      itemRepo.findOne.mockResolvedValue(null);
      categoryRepo.findOne.mockResolvedValue(null); // Category doesn't exist

      const file = {
        buffer: Buffer.from(
          'name,type,price,category_name\nProduct A,PRODUCT,100,Supplements',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      await service.importItems(tenantId, file);

      expect(countersService.getNextCategoryCode).toHaveBeenCalledWith(
        tenantId,
      );
      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          name: 'Supplements',
          status: CategoryStatus.ACTIVE,
        }),
      );
      expect(categoryRepo.save).toHaveBeenCalled();
    });

    it('creates parent and child categories for depth 2', async () => {
      itemRepo.findOne.mockResolvedValue(null);
      categoryRepo.findOne.mockResolvedValue(null); // Neither parent nor child exist

      const file = {
        buffer: Buffer.from(
          'name,type,price,category_name,parent_category_name\nPT Single,SERVICE,150000,Personal Training,Services',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      await service.importItems(tenantId, file);

      // Should create parent first, then child
      expect(countersService.getNextCategoryCode).toHaveBeenCalledTimes(2);
      expect(categoryRepo.save).toHaveBeenCalledTimes(2);
    });

    it('reuses existing category by name', async () => {
      const existingCategory = {
        id: 'cat-123',
        tenantId,
        name: 'Supplements',
        code: 'CAT-000001',
      } as CategoryEntity;

      itemRepo.findOne.mockResolvedValue(null);
      categoryRepo.findOne.mockResolvedValue(existingCategory);

      const file = {
        buffer: Buffer.from(
          'name,type,price,category_name\nProduct A,PRODUCT,100,Supplements',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      await service.importItems(tenantId, file);

      expect(countersService.getNextCategoryCode).not.toHaveBeenCalled();
      expect(categoryRepo.create).not.toHaveBeenCalled();
    });

    it('enforces max depth rule (parent must have no parent)', async () => {
      const grandparentCategory = {
        id: 'grandparent-id',
        tenantId,
        name: 'GrandParent',
        parentId: 'some-other-id', // Has a parent - violates depth rule
      } as CategoryEntity;

      itemRepo.findOne.mockResolvedValue(null);
      categoryRepo.findOne.mockResolvedValue(grandparentCategory);

      const file = {
        buffer: Buffer.from(
          'name,type,price,category_name,parent_category_name\nItem,PRODUCT,100,Child,GrandParent',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      expect(result.errorCount).toBe(1);
      expect(result.results[0].error).toContain(
        CATEGORY_ERRORS.MAX_DEPTH.message,
      );
    });
  });

  describe('processImageUrl (C4B-BE-03)', () => {
    it('downloads and stores image when URL provided', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      const file = {
        buffer: Buffer.from(
          'name,type,price,image_url\nProduct A,PRODUCT,100,https://example.com/image.jpg',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      await service.importItems(tenantId, file);

      expect(storageService.downloadAndStoreFromUrl).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        `items/${tenantId}`,
      );
      expect(itemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          imageKey: 'items/tenant-123/uuid.jpg',
          imageUrl: 'http://minio/bucket/items/tenant-123/uuid.jpg',
          imageMimeType: 'image/jpeg',
          imageSize: 5000,
        }),
      );
    });

    it('deletes old image before storing new one', async () => {
      const existingItem = {
        id: 'item-1',
        tenantId,
        name: 'Product A',
        type: ItemType.PRODUCT,
        price: 100,
        imageKey: 'items/tenant-123/old-image.jpg',
        imageUrl: 'http://minio/bucket/items/tenant-123/old-image.jpg',
      } as ItemEntity;
      itemRepo.findOne.mockResolvedValue(existingItem);

      const file = {
        buffer: Buffer.from(
          'name,type,price,image_url\nProduct A,PRODUCT,100,https://example.com/new-image.jpg',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      await service.importItems(tenantId, file);

      expect(storageService.deleteFile).toHaveBeenCalledWith(
        'items/tenant-123/old-image.jpg',
      );
    });

    it('skips image processing when storage not configured', async () => {
      storageService.isConfigured.mockReturnValue(false);
      itemRepo.findOne.mockResolvedValue(null);

      const file = {
        buffer: Buffer.from(
          'name,type,price,image_url\nProduct A,PRODUCT,100,https://example.com/image.jpg',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      expect(result.successCount).toBe(1);
      expect(storageService.downloadAndStoreFromUrl).not.toHaveBeenCalled();
    });

    it('does not fail row when image download fails', async () => {
      storageService.downloadAndStoreFromUrl.mockRejectedValue(
        new BadRequestException('Failed to download'),
      );
      itemRepo.findOne.mockResolvedValue(null);

      const file = {
        buffer: Buffer.from(
          'name,type,price,image_url\nProduct A,PRODUCT,100,https://invalid.url/image.jpg',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      // Row should still succeed, just without image
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('service item validation', () => {
    it('imports membership service with required fields', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      const file = {
        buffer: Buffer.from(
          'name,type,price,service_kind,duration_value,duration_unit\nMonthly Membership,SERVICE,500000,MEMBERSHIP,30,DAY',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      expect(result.successCount).toBe(1);
      expect(itemsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monthly Membership',
          type: ItemType.SERVICE,
          serviceKind: ItemServiceKind.MEMBERSHIP,
          durationValue: 30,
          durationUnit: ItemDurationUnit.DAY,
        }),
        tenantId,
      );
    });

    it('imports PT session service with session count', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      const file = {
        buffer: Buffer.from(
          'name,type,price,service_kind,duration_value,duration_unit,session_count\nPT Package 12,SERVICE,1800000,PT_SESSION,90,DAY,12',
        ),
        mimetype: 'text/csv',
        filename: 'items.csv',
      };

      const result = await service.importItems(tenantId, file);

      expect(result.successCount).toBe(1);
      expect(itemsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PT Package 12',
          serviceKind: ItemServiceKind.PT_SESSION,
          sessionCount: 12,
        }),
        tenantId,
      );
    });
  });
});
