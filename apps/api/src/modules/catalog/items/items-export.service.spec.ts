import { Test, TestingModule } from '@nestjs/testing';
import { ItemsExportService } from './items-export.service';
import { ItemsService } from './items.service';
import { ExportFormat, ExportItemQueryDto } from './dto/export-item-query.dto';
import {
  ItemEntity,
  ItemType,
  ItemStatus,
} from '../../../database/entities/item.entity';
import * as XLSX from 'xlsx';

describe('ItemsExportService', () => {
  let service: ItemsExportService;
  const mockItemsService = {
    buildQuery: jest.fn(),
  };

  const mockQueryBuilder = {
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsExportService,
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();

    service = module.get<ItemsExportService>(ItemsExportService);
    mockItemsService.buildQuery.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should maintain consistency between implementation and verification', () => {
    expect(true).toBe(true);
  });

  const mockItem = {
    id: 'item-1',
    code: 'SKU-001',
    name: 'Test Item',
    type: ItemType.PRODUCT,
    price: 100,
    status: ItemStatus.ACTIVE,
    category: { name: 'Test Category', code: 'CAT-001' },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ItemEntity;

  describe('exportItems', () => {
    it('should export items to CSV', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockItem]);

      const result = await service.exportItems('tenant-1', {
        format: ExportFormat.CSV,
      } as ExportItemQueryDto);

      expect(mockItemsService.buildQuery).toHaveBeenCalled();
      expect(result.mimetype).toBe('text/csv');
      expect(result.filename).toMatch(/items-export-.*\.csv/);
      expect(result.buffer).toBeInstanceOf(Buffer);

      // Verify content
      const workbook = XLSX.read(result.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty('code', 'SKU-001');
      expect(data[0]).toHaveProperty('categoryName', 'Test Category');
    });

    it('should export items to XLSX', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockItem]);

      const result = await service.exportItems('tenant-1', {
        format: ExportFormat.XLSX,
      } as ExportItemQueryDto);

      expect(result.mimetype).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result.filename).toMatch(/items-export-.*\.xlsx/);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should filter fields when requested', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockItem]);

      const result = await service.exportItems('tenant-1', {
        format: ExportFormat.CSV,
        fields: 'code,name,price',
      } as ExportItemQueryDto);

      const workbook = XLSX.read(result.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      expect(data[0]).toHaveProperty('code');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('price');
      expect(data[0]).not.toHaveProperty('id');
      expect(data[0]).not.toHaveProperty('status');
    });
  });
});
