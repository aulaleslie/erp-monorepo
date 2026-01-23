import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ITEM_ERRORS } from '@gym-monorepo/shared';

import { TenantCountersService } from '../../tenant-counters/tenant-counters.service';
import { TagsService } from '../../tags/tags.service';
import { StorageService } from '../../storage/storage.service';
import {
  ItemEntity,
  ItemStatus,
  ItemType,
  ItemServiceKind,
} from '../../../database/entities/item.entity';
import { CategoryEntity } from '../../../database/entities/category.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemQueryDto } from './dto/item-query.dto';
import { paginate, calculateSkip } from '../../../common/dto/pagination.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly tenantCountersService: TenantCountersService,
    private readonly tagsService: TagsService,
    private readonly storageService: StorageService,
  ) {}

  async create(createItemDto: CreateItemDto, tenantId: string) {
    // Validate service fields based on type
    this.validateServiceFields(createItemDto);

    // Validate category exists if provided
    if (createItemDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createItemDto.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check for duplicate barcode if provided
    if (createItemDto.barcode) {
      await this.assertBarcodeUnique(tenantId, createItemDto.barcode);
    }

    // Generate code server-side
    const code = await this.tenantCountersService.getNextItemCode(tenantId);

    // Clear service fields for PRODUCT type
    const itemData = this.sanitizeServiceFields(createItemDto);

    const item = this.itemRepository.create({
      ...itemData,
      tenantId,
      code,
      status: ItemStatus.ACTIVE,
    });

    const saved = await this.itemRepository.save(item);

    if (createItemDto.tags && createItemDto.tags.length > 0) {
      await this.tagsService.assign(tenantId, {
        resourceType: 'items',
        resourceId: saved.id,
        tags: createItemDto.tags,
      });
    }

    return saved;
  }

  async findAll(query: ItemQueryDto, tenantId: string) {
    const { page = 1, limit = 10 } = query;
    const skip = calculateSkip(page, limit);

    const queryBuilder = this.buildQuery(query, tenantId);

    queryBuilder.orderBy('item.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // Attach tags
    const resourceIds = items.map((i) => i.id);
    const tagsMap = await this.tagsService.findTagsForResources(
      tenantId,
      'items',
      resourceIds,
    );

    items.forEach((item) => {
      item.tags = (tagsMap.get(item.id) || []).map((t) => t.name);
    });

    return paginate(items, total, page, limit);
  }

  buildQuery(query: ItemQueryDto, tenantId: string) {
    const { search, type, serviceKind, categoryId, status } = query;

    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.tenantId = :tenantId', { tenantId });

    if (search) {
      queryBuilder.andWhere(
        '(item.code ILIKE :search OR item.name ILIKE :search OR item.barcode ILIKE :search OR EXISTS (SELECT 1 FROM tag_links tl INNER JOIN tags t ON t.id = tl."tagId" WHERE tl."resourceType" = \'items\' AND tl."resourceId" = item.id AND t."nameNormalized" ILIKE :search))',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('item.type = :type', { type });
    }

    if (serviceKind) {
      queryBuilder.andWhere('item.serviceKind = :serviceKind', { serviceKind });
    }

    if (categoryId) {
      queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    if (status) {
      queryBuilder.andWhere('item.status = :status', { status });
    }

    return queryBuilder;
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.itemRepository.findOne({
      where: { id, tenantId },
      relations: ['category'],
    });

    if (!item) {
      throw new NotFoundException(ITEM_ERRORS.NOT_FOUND.message);
    }

    const tagsMap = await this.tagsService.findTagsForResources(
      tenantId,
      'items',
      [id],
    );
    item.tags = (tagsMap.get(id) || []).map((t) => t.name);

    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto, tenantId: string) {
    const item = await this.findOne(id, tenantId);

    // If type is being updated, validate service fields for new type
    const effectiveType = updateItemDto.type ?? item.type;
    const effectiveServiceKind = updateItemDto.serviceKind ?? item.serviceKind;

    // Create a merged DTO for validation
    const mergedDto = {
      ...updateItemDto,
      type: effectiveType,
      serviceKind: effectiveServiceKind,
      durationValue: updateItemDto.durationValue ?? item.durationValue,
      durationUnit: updateItemDto.durationUnit ?? item.durationUnit,
      sessionCount: updateItemDto.sessionCount ?? item.sessionCount,
    };

    this.validateServiceFields(mergedDto as CreateItemDto);

    // Check barcode uniqueness if being updated
    if (updateItemDto.barcode && updateItemDto.barcode !== item.barcode) {
      await this.assertBarcodeUnique(tenantId, updateItemDto.barcode, id);
    }

    // Validate category exists if being updated
    if (
      updateItemDto.categoryId &&
      updateItemDto.categoryId !== item.categoryId
    ) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateItemDto.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Sanitize service fields based on final type
    const sanitizedData = this.sanitizeServiceFields({
      ...updateItemDto,
      type: effectiveType,
      serviceKind: effectiveServiceKind,
    } as CreateItemDto);

    Object.assign(item, sanitizedData);
    const saved = await this.itemRepository.save(item);

    if (updateItemDto.tags !== undefined) {
      await this.tagsService.sync(tenantId, {
        resourceType: 'items',
        resourceId: id,
        tags: updateItemDto.tags,
      });
    }

    return saved;
  }

  async remove(id: string, tenantId: string) {
    const item = await this.findOne(id, tenantId);

    item.status = ItemStatus.INACTIVE;

    return this.itemRepository.save(item);
  }

  async uploadImage(
    id: string,
    tenantId: string,
    file: { buffer: Buffer; mimetype: string; filename: string; size: number },
  ): Promise<ItemEntity> {
    const item = await this.findOne(id, tenantId);

    // Validate file type and size (throws BadRequestException if invalid)
    this.storageService.validateFile(file.mimetype, file.size);

    // Generate object key with tenant prefix
    const objectKey = this.storageService.generateObjectKey(
      `items/${tenantId}`,
      file.filename,
    );

    // Delete old image if exists
    if (item.imageKey) {
      try {
        await this.storageService.deleteFile(item.imageKey);
      } catch {
        // Ignore deletion errors for old files
      }
    }

    // Upload new file to MinIO
    const imageUrl = await this.storageService.uploadFile(
      file.buffer,
      objectKey,
      file.mimetype,
      file.size,
    );

    // Update item with image metadata
    item.imageKey = objectKey;
    item.imageUrl = imageUrl;
    item.imageMimeType = file.mimetype;
    item.imageSize = file.size;

    return this.itemRepository.save(item);
  }

  validateServiceFields(dto: CreateItemDto): void {
    if (dto.type === ItemType.PRODUCT) {
      // PRODUCT should not have service-related fields
      if (
        dto.serviceKind ||
        dto.durationValue ||
        dto.durationUnit ||
        dto.sessionCount ||
        dto.includedPtSessions
      ) {
        throw new BadRequestException(
          'PRODUCT type cannot have service fields (serviceKind, duration, sessionCount, includedPtSessions)',
        );
      }
      return;
    }

    // SERVICE type validation
    if (dto.type === ItemType.SERVICE) {
      if (!dto.serviceKind) {
        throw new BadRequestException(
          'serviceKind is required for SERVICE type',
        );
      }

      if (dto.serviceKind === ItemServiceKind.MEMBERSHIP) {
        if (!dto.durationValue || !dto.durationUnit) {
          throw new BadRequestException(
            'durationValue and durationUnit are required for MEMBERSHIP',
          );
        }
        // sessionCount should be null for MEMBERSHIP
        if (dto.sessionCount) {
          throw new BadRequestException(
            'sessionCount is not allowed for MEMBERSHIP service kind',
          );
        }
      }

      if (dto.serviceKind === ItemServiceKind.PT_SESSION) {
        if (!dto.durationValue || !dto.durationUnit || !dto.sessionCount) {
          throw new BadRequestException(
            'durationValue, durationUnit, and sessionCount are required for PT_SESSION',
          );
        }
        // includedPtSessions should be null for PT_SESSION
        if (dto.includedPtSessions) {
          throw new BadRequestException(
            'includedPtSessions is not allowed for PT_SESSION service kind',
          );
        }
      }
    }
  }

  private sanitizeServiceFields(dto: CreateItemDto): Partial<CreateItemDto> {
    const result: Partial<CreateItemDto> = { ...dto };

    if (dto.type === ItemType.PRODUCT) {
      // Clear all service fields for PRODUCT
      result.serviceKind = undefined;
      result.durationValue = undefined;
      result.durationUnit = undefined;
      result.sessionCount = undefined;
      result.includedPtSessions = undefined;
    } else if (dto.type === ItemType.SERVICE) {
      if (dto.serviceKind === ItemServiceKind.MEMBERSHIP) {
        // Clear sessionCount for MEMBERSHIP
        result.sessionCount = undefined;
      } else if (dto.serviceKind === ItemServiceKind.PT_SESSION) {
        // Clear includedPtSessions for PT_SESSION
        result.includedPtSessions = undefined;
      }
    }

    return result;
  }

  private async assertBarcodeUnique(
    tenantId: string,
    barcode: string,
    excludeId?: string,
  ): Promise<void> {
    const whereCondition: Record<string, unknown> = {
      tenantId,
      barcode,
    };

    if (excludeId) {
      whereCondition.id = Not(excludeId);
    }

    const existing = await this.itemRepository.findOne({
      where: whereCondition,
    });

    if (existing) {
      throw new ConflictException(ITEM_ERRORS.DUPLICATE_BARCODE.message);
    }
  }
}
