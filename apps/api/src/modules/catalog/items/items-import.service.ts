import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { ItemEntity } from '../../../database/entities/item.entity';
import {
  CategoryEntity,
  CategoryStatus,
} from '../../../database/entities/category.entity';
import { TenantCountersService } from '../../tenant-counters/tenant-counters.service';
import { StorageService } from '../../storage/storage.service';
import {
  ImportItemRowDto,
  ImportResult,
  ImportRowResult,
} from './dto/import-item-row.dto';
import { IMPORT_ERRORS, CATEGORY_ERRORS } from '@gym-monorepo/shared';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';

const REQUIRED_COLUMNS = ['name', 'type', 'price'];
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

@Injectable()
export class ItemsImportService {
  private readonly logger = new Logger(ItemsImportService.name);

  constructor(
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly tenantCountersService: TenantCountersService,
    private readonly storageService: StorageService,
    private readonly itemsService: ItemsService,
  ) {}

  /**
   * Main entry point for importing items from a file
   */
  async importItems(
    tenantId: string,
    file: { buffer: Buffer; mimetype: string; filename: string },
  ): Promise<ImportResult> {
    // Parse file into rows
    const rows = this.parseFile(file.buffer, file.mimetype, file.filename);

    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in file');
    }

    // Validate required columns exist
    this.validateRequiredColumns(rows[0]);

    const results: ImportRowResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +1 for header, +1 for 1-indexed
      const row = rows[i];

      try {
        const result = await this.processRow(tenantId, row, rowNumber);
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        results.push({
          row: rowNumber,
          success: false,
          error: getErrorMessage(error),
        });
        errorCount++;
      }
    }

    return {
      totalRows: rows.length,
      successCount,
      errorCount,
      results,
    };
  }

  /**
   * Parse CSV or XLSX file into array of row objects
   */
  private parseFile(
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Record<string, string>[] {
    const extension = filename.split('.').pop()?.toLowerCase();
    const isXlsx =
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      extension === 'xlsx';
    const isCsv = mimeType === 'text/csv' || extension === 'csv';

    if (isXlsx) {
      return this.parseXlsx(buffer);
    } else if (isCsv) {
      return this.parseCsv(buffer);
    } else {
      throw new BadRequestException(IMPORT_ERRORS.INVALID_FILE_FORMAT.message);
    }
  }

  private parseXlsx(buffer: Buffer): Record<string, string>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  private parseCsv(buffer: Buffer): Record<string, string>[] {
    return parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  /**
   * Validate that required columns exist in the first row
   */
  private validateRequiredColumns(firstRow: Record<string, string>): void {
    const columns = Object.keys(firstRow).map((c) => c.toLowerCase());
    for (const required of REQUIRED_COLUMNS) {
      if (!columns.includes(required)) {
        throw new BadRequestException(
          `${IMPORT_ERRORS.MISSING_REQUIRED_COLUMN.message}: ${required}`,
        );
      }
    }
  }

  /**
   * Process a single import row
   */
  private async processRow(
    tenantId: string,
    row: Record<string, string>,
    rowNumber: number,
  ): Promise<ImportRowResult> {
    // Normalize keys to lowercase
    const normalizedRow: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      normalizedRow[key.toLowerCase()] = value;
    }

    // Convert to DTO and validate
    const dto = plainToInstance(ImportItemRowDto, normalizedRow);
    const errors = await validate(dto, { skipMissingProperties: false });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join('; ');
      return {
        row: rowNumber,
        success: false,
        error: `${IMPORT_ERRORS.INVALID_ROW_DATA.message}: ${errorMessages}`,
      };
    }

    // Find or create category if specified
    let categoryId: string | null = null;
    if (dto.category_name) {
      try {
        categoryId = await this.findOrCreateCategory(
          tenantId,
          dto.category_name,
          dto.parent_category_name,
        );
      } catch (error) {
        return {
          row: rowNumber,
          success: false,
          error: getErrorMessage(error),
        };
      }
    }

    // Check if item exists (upsert logic)
    const existingItem = await this.itemRepository.findOne({
      where: {
        tenantId,
        name: dto.name,
        type: dto.type,
        categoryId: categoryId ?? IsNull(),
      },
    });

    try {
      let item: ItemEntity;

      if (existingItem) {
        // Update existing item
        item = await this.updateItemFromImport(existingItem, dto);
      } else {
        // Create new item
        item = await this.createItemFromImport(dto, tenantId, categoryId);
      }

      // Process image URL if provided (C4B-BE-03)
      if (dto.image_url) {
        try {
          await this.processImageUrl(item, dto.image_url, tenantId);
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          this.logger.warn(
            `Row ${rowNumber}: Failed to process image URL: ${errorMessage}`,
          );
          // Don't fail the row for image errors, just log
        }
      }

      return {
        row: rowNumber,
        success: true,
        itemId: item.id,
        itemCode: item.code,
      };
    } catch (error) {
      return {
        row: rowNumber,
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Find or create category by name, optionally with parent
   */
  private async findOrCreateCategory(
    tenantId: string,
    categoryName: string,
    parentCategoryName?: string,
  ): Promise<string> {
    let parentId: string | null = null;

    // If parent specified, find or create it first
    if (parentCategoryName) {
      let parent = await this.categoryRepository.findOne({
        where: {
          tenantId,
          name: parentCategoryName,
          parentId: null as unknown as undefined, // TypeORM quirk for null comparison
        },
      });

      if (!parent) {
        // Create parent category
        const parentCode =
          await this.tenantCountersService.getNextCategoryCode(tenantId);
        parent = this.categoryRepository.create({
          tenantId,
          name: parentCategoryName,
          code: parentCode,
          status: CategoryStatus.ACTIVE,
          parentId: null,
        });
        parent = await this.categoryRepository.save(parent);
      }

      // Check depth - parent must not have a parent
      if (parent.parentId) {
        throw new BadRequestException(CATEGORY_ERRORS.MAX_DEPTH.message);
      }

      parentId = parent.id;
    }

    // Find or create the category
    let category = await this.categoryRepository.findOne({
      where: {
        tenantId,
        name: categoryName,
        parentId: parentId as unknown as undefined, // TypeORM quirk
      },
    });

    if (!category) {
      const code =
        await this.tenantCountersService.getNextCategoryCode(tenantId);
      category = this.categoryRepository.create({
        tenantId,
        name: categoryName,
        code,
        status: CategoryStatus.ACTIVE,
        parentId,
      });
      category = await this.categoryRepository.save(category);
    }

    return category.id;
  }

  /**
   * Create a new item from import row data
   */
  private async createItemFromImport(
    dto: ImportItemRowDto,
    tenantId: string,
    categoryId: string | null,
  ): Promise<ItemEntity> {
    const createDto: CreateItemDto = {
      name: dto.name,
      type: dto.type,
      price: dto.price,
      categoryId: categoryId || undefined,
      serviceKind: dto.service_kind,
      barcode: dto.barcode || undefined,
      unit: dto.unit || undefined,
      tags: dto.tags ? dto.tags.split(',').map((t) => t.trim()) : undefined,
      description: dto.description || undefined,
      durationValue: dto.duration_value,
      durationUnit: dto.duration_unit,
      sessionCount: dto.session_count,
      includedPtSessions: dto.included_pt_sessions,
    };

    return this.itemsService.create(createDto, tenantId);
  }

  /**
   * Update existing item from import row data
   */
  private async updateItemFromImport(
    item: ItemEntity,
    dto: ImportItemRowDto,
  ): Promise<ItemEntity> {
    // Update only non-empty fields from import
    if (dto.price !== undefined) item.price = dto.price;
    if (dto.status) item.status = dto.status;
    if (dto.barcode !== undefined) item.barcode = dto.barcode || null;
    if (dto.unit !== undefined) item.unit = dto.unit || null;
    if (dto.tags) item.tags = dto.tags.split(',').map((t) => t.trim());
    if (dto.description !== undefined) {
      item.description = dto.description || null;
    }
    if (dto.duration_value !== undefined) {
      item.durationValue = dto.duration_value;
    }
    if (dto.duration_unit) item.durationUnit = dto.duration_unit;
    if (dto.session_count !== undefined) item.sessionCount = dto.session_count;
    if (dto.included_pt_sessions !== undefined)
      item.includedPtSessions = dto.included_pt_sessions;

    // Validate service fields
    this.itemsService.validateServiceFields({
      ...dto,
      serviceKind: dto.service_kind,
      durationValue: dto.duration_value,
      durationUnit: dto.duration_unit,
      sessionCount: dto.session_count,
      includedPtSessions: dto.included_pt_sessions,
    } as CreateItemDto);

    return this.itemRepository.save(item);
  }

  /**
   * Process image URL - download, validate, store in MinIO (C4B-BE-03)
   */
  private async processImageUrl(
    item: ItemEntity,
    imageUrl: string,
    tenantId: string,
  ): Promise<void> {
    if (!this.storageService.isConfigured()) {
      this.logger.warn('Storage not configured, skipping image download');
      return;
    }

    // Delete old image if exists
    if (item.imageKey) {
      try {
        await this.storageService.deleteFile(item.imageKey);
      } catch {
        // Ignore deletion errors
      }
    }

    // Download and store new image
    const imageData = await this.storageService.downloadAndStoreFromUrl(
      imageUrl,
      `items/${tenantId}`,
    );

    // Update item with image metadata
    item.imageKey = imageData.imageKey;
    item.imageUrl = imageData.imageUrl;
    item.imageMimeType = imageData.imageMimeType;
    item.imageSize = imageData.imageSize;

    await this.itemRepository.save(item);
  }
}
