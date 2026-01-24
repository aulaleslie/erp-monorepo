import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import {
  DocumentStatus,
  PaginatedResponse,
  TAG_ERRORS,
} from '@gym-monorepo/shared';
import {
  DocumentEntity,
  TagEntity,
  TagLinkEntity,
} from '../../database/entities';
import { TenantsService } from '../tenants/tenants.service';
import { TagAssignmentDto } from './dto/tag-assignment.dto';
import { TagListQueryDto } from './dto/tag-list-query.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { calculateSkip, paginate } from '../../common/dto/pagination.dto';

export interface ResourceTag {
  resourceId: string;
  tags: TagSummary[];
}

interface TagSummary {
  id: string;
  name: string;
  usageCount: number;
  lastUsedAt: Date | null;
}

interface TagAssignmentResult {
  assigned: TagSummary[];
}

interface TagRemovalResult {
  removed: Array<Pick<TagSummary, 'id' | 'name'>>;
}

interface TagSyncResult {
  assigned: TagSummary[];
  removed: Array<Pick<TagSummary, 'id' | 'name'>>;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
    @InjectRepository(TagLinkEntity)
    private readonly tagLinkRepository: Repository<TagLinkEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    private readonly tenantsService: TenantsService,
  ) {}

  async list(
    tenantId: string,
    query: TagListQueryDto,
  ): Promise<PaginatedResponse<TagEntity>> {
    const { page, limit, query: searchTerm, includeInactive } = query;
    const where = this.buildSearchWhere(
      tenantId,
      includeInactive ?? false,
      searchTerm,
    );
    const [items, total] = await Promise.all([
      this.tagRepository.find({
        where,
        order: { isActive: 'DESC', name: 'ASC' },
        skip: calculateSkip(page, limit),
        take: limit,
      }),
      this.tagRepository.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async suggest(tenantId: string, query?: string): Promise<TagSummary[]> {
    const where = this.buildSearchWhere(tenantId, false, query);
    const tags = await this.tagRepository.find({
      where,
      order: { usageCount: 'DESC', lastUsedAt: 'DESC', name: 'ASC' },
      take: 10,
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      usageCount: tag.usageCount,
      lastUsedAt: tag.lastUsedAt,
    }));
  }

  async update(
    tenantId: string,
    tagId: string,
    dto: UpdateTagDto,
  ): Promise<TagEntity> {
    const tag = await this.tagRepository.findOne({
      where: { id: tagId, tenantId },
    });

    if (!tag) {
      throw new NotFoundException(TAG_ERRORS.NOT_FOUND.message);
    }

    if (dto.name !== undefined && dto.name !== null) {
      const normalized = this.normalizeRawTag(dto.name);
      if (!normalized) {
        throw new BadRequestException(TAG_ERRORS.INVALID_NAME.message);
      }

      await this.enforceTenantTagRules(tenantId, [normalized]);

      const existingTag = await this.tagRepository.findOne({
        where: { tenantId, nameNormalized: normalized.normalized },
      });
      if (existingTag && existingTag.id !== tag.id) {
        throw new BadRequestException(TAG_ERRORS.DUPLICATE_NAME.message);
      }

      tag.name = normalized.original;
      tag.nameNormalized = normalized.normalized;
    }

    if (dto.isActive !== undefined) {
      tag.isActive = dto.isActive;
    }

    return this.tagRepository.save(tag);
  }

  async assign(
    tenantId: string,
    dto: TagAssignmentDto,
  ): Promise<TagAssignmentResult> {
    const normalizedResourceType = this.normalizeResourceType(dto.resourceType);
    await this.ensureResourceUnlocked(
      tenantId,
      normalizedResourceType,
      dto.resourceId,
    );

    const normalizedTags = this.normalizeTags(dto.tags);

    if (normalizedTags.length === 0) {
      throw new BadRequestException(TAG_ERRORS.INVALID_NAME.message);
    }

    await this.enforceTenantTagRules(tenantId, normalizedTags);

    const normalizedValues = normalizedTags.map((tag) => tag.normalized);

    const existingTags = await this.tagRepository.find({
      where: {
        tenantId,
        nameNormalized: In(normalizedValues),
      },
    });

    const existingNormalized = new Set(
      existingTags.map((tag) => tag.nameNormalized),
    );

    const missingTags = normalizedTags.filter(
      (tag) => !existingNormalized.has(tag.normalized),
    );

    const newTags = missingTags.map((tag) =>
      this.tagRepository.create({
        tenantId,
        name: tag.original,
        nameNormalized: tag.normalized,
        usageCount: 0,
        lastUsedAt: null,
        isActive: true,
      }),
    );

    const savedNewTags = newTags.length
      ? await this.tagRepository.save(newTags)
      : [];

    const allTags = [...existingTags, ...savedNewTags];
    const tagByNormalized = new Map(
      allTags.map((tag) => [tag.nameNormalized, tag] as const),
    );

    const existingLinks = await this.tagLinkRepository.find({
      where: {
        tenantId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
      },
    });

    const alreadyAssigned = new Set(existingLinks.map((link) => link.tagId));

    const now = new Date();
    const linksToSave: TagLinkEntity[] = [];
    const tagsToUpdate = new Map<string, TagEntity>();

    for (const { normalized } of normalizedTags) {
      const tag = tagByNormalized.get(normalized);
      if (!tag || alreadyAssigned.has(tag.id)) {
        continue;
      }

      const link = this.tagLinkRepository.create({
        tenantId,
        tagId: tag.id,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
      });
      linksToSave.push(link);

      tag.usageCount = (tag.usageCount ?? 0) + 1;
      tag.lastUsedAt = now;
      tagsToUpdate.set(tag.id, tag);
    }

    if (linksToSave.length > 0) {
      await this.tagLinkRepository.save(linksToSave);
      await this.tagRepository.save(Array.from(tagsToUpdate.values()));
    }

    return {
      assigned: Array.from(tagsToUpdate.values()).map((tag) => ({
        id: tag.id,
        name: tag.name,
        usageCount: tag.usageCount,
        lastUsedAt: tag.lastUsedAt,
      })),
    };
  }

  async sync(tenantId: string, dto: TagAssignmentDto): Promise<TagSyncResult> {
    const normalizedResourceType = this.normalizeResourceType(dto.resourceType);
    await this.ensureResourceUnlocked(
      tenantId,
      normalizedResourceType,
      dto.resourceId,
    );

    const targetTags = this.normalizeTags(dto.tags);
    const targetNormalized = new Set(targetTags.map((t) => t.normalized));

    // 1. Get current tags
    const currentLinks = await this.tagLinkRepository.find({
      where: {
        tenantId,
        resourceId: dto.resourceId,
        resourceType: dto.resourceType,
      },
      relations: ['tag'],
    });

    const currentNormalized = new Set(
      currentLinks.map((link) => link.tag.nameNormalized),
    );

    // 2. Determine what to add and what to remove
    const toAdd = targetTags.filter(
      (t) => !currentNormalized.has(t.normalized),
    );
    const toRemove = currentLinks
      .filter((link) => !targetNormalized.has(link.tag.nameNormalized))
      .map((link) => link.tag.name);

    let assigned: TagSummary[] = [];
    let removed: Array<Pick<TagSummary, 'id' | 'name'>> = [];

    // 3. Perform removal
    if (toRemove.length > 0) {
      const removalResult = await this.remove(tenantId, {
        resourceId: dto.resourceId,
        resourceType: dto.resourceType,
        tags: toRemove,
      });
      removed = removalResult.removed;
    }

    // 4. Perform assignment
    if (toAdd.length > 0) {
      const assignmentResult = await this.assign(tenantId, {
        resourceId: dto.resourceId,
        resourceType: dto.resourceType,
        tags: toAdd.map((t) => t.original),
      });
      assigned = assignmentResult.assigned;
    }

    return { assigned, removed };
  }

  async remove(
    tenantId: string,
    dto: TagAssignmentDto,
  ): Promise<TagRemovalResult> {
    const normalizedResourceType = this.normalizeResourceType(dto.resourceType);
    await this.ensureResourceUnlocked(
      tenantId,
      normalizedResourceType,
      dto.resourceId,
    );

    const normalizedTags = this.normalizeTags(dto.tags);

    if (normalizedTags.length === 0) {
      throw new BadRequestException(TAG_ERRORS.INVALID_NAME.message);
    }

    const normalizedValues = normalizedTags.map((tag) => tag.normalized);

    const tagsToRemove = await this.tagRepository.find({
      where: {
        tenantId,
        nameNormalized: In(normalizedValues),
      },
    });

    if (tagsToRemove.length === 0) {
      return { removed: [] };
    }

    const tagIds = tagsToRemove.map((tag) => tag.id);

    const linksToDelete = await this.tagLinkRepository.find({
      where: {
        tenantId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        tagId: In(tagIds),
      },
      relations: ['tag'],
    });

    if (linksToDelete.length === 0) {
      return { removed: [] };
    }

    await this.tagLinkRepository.remove(linksToDelete);

    const now = new Date();
    const tagsToUpdate = new Map<string, TagEntity>();

    for (const link of linksToDelete) {
      const tag = link.tag;
      tag.usageCount = Math.max((tag.usageCount ?? 0) - 1, 0);
      tag.lastUsedAt = now;
      tagsToUpdate.set(tag.id, tag);
    }

    if (tagsToUpdate.size > 0) {
      await this.tagRepository.save(Array.from(tagsToUpdate.values()));
    }
    return {
      removed: Array.from(tagsToUpdate.values()).map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
    };
  }

  async findTagsForResources(
    tenantId: string,
    resourceType: string,
    resourceIds: string[],
  ): Promise<Map<string, TagSummary[]>> {
    if (resourceIds.length === 0) {
      return new Map();
    }

    const links = await this.tagLinkRepository.find({
      where: {
        tenantId,
        resourceType,
        resourceId: In(resourceIds),
      },
      relations: ['tag'],
    });

    const resultMap = new Map<string, TagSummary[]>();
    for (const link of links) {
      const tags = resultMap.get(link.resourceId) || [];
      tags.push({
        id: link.tag.id,
        name: link.tag.name,
        usageCount: link.tag.usageCount,
        lastUsedAt: link.tag.lastUsedAt,
      });
      resultMap.set(link.resourceId, tags);
    }

    return resultMap;
  }

  private buildSearchWhere(
    tenantId: string,
    includeInactive: boolean,
    search?: string,
  ): FindOptionsWhere<TagEntity> | FindOptionsWhere<TagEntity>[] {
    const baseFilter: FindOptionsWhere<TagEntity> = { tenantId };
    if (!includeInactive) {
      baseFilter.isActive = true;
    }

    const trimmed = search?.trim();
    if (!trimmed) {
      return baseFilter;
    }

    const normalizedPattern = `%${trimmed.toLowerCase()}%`;
    const displayPattern = `%${trimmed}%`;

    return [
      { ...baseFilter, name: ILike(displayPattern) },
      { ...baseFilter, nameNormalized: ILike(normalizedPattern) },
    ];
  }

  private normalizeTags(
    tags: string[],
  ): Array<{ normalized: string; original: string }> {
    const normalizedMap = new Map<string, string>();

    for (const raw of tags ?? []) {
      const normalized = this.normalizeRawTag(raw);
      if (!normalized) {
        continue;
      }

      if (!normalizedMap.has(normalized.normalized)) {
        normalizedMap.set(normalized.normalized, normalized.original);
      }
    }

    return Array.from(normalizedMap.entries()).map(
      ([normalized, original]) => ({
        normalized,
        original,
      }),
    );
  }

  private normalizeRawTag(
    raw: string,
  ): { normalized: string; original: string } | null {
    if (!raw) {
      return null;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    return {
      normalized: trimmed.toLowerCase(),
      original: trimmed,
    };
  }

  private normalizeResourceType(resourceType: string): string {
    return (resourceType ?? '').trim().toLowerCase();
  }

  private async ensureResourceUnlocked(
    tenantId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<void> {
    if (resourceType !== 'document') {
      return;
    }

    const document = await this.documentRepository.findOne({
      where: { id: resourceId, tenantId },
      select: ['status'],
    });

    if (!document) {
      return;
    }

    if (
      document.status === DocumentStatus.APPROVED ||
      document.status === DocumentStatus.POSTED
    ) {
      throw new BadRequestException(TAG_ERRORS.LOCKED.message);
    }
  }

  private async enforceTenantTagRules(
    tenantId: string,
    tags: Array<{ normalized: string; original: string }>,
  ): Promise<void> {
    const tenant = await this.tenantsService.getTenantById(tenantId);
    const { tagMaxLength, tagAllowedPattern } = tenant;

    if (!tagMaxLength && !tagAllowedPattern) {
      return;
    }

    let allowedPattern: RegExp | null = null;
    if (tagAllowedPattern) {
      try {
        allowedPattern = new RegExp(tagAllowedPattern);
      } catch {
        allowedPattern = null;
      }
    }

    for (const { original } of tags) {
      if (typeof tagMaxLength === 'number' && tagMaxLength > 0) {
        if (original.length > tagMaxLength) {
          throw new BadRequestException(TAG_ERRORS.NAME_TOO_LONG.message);
        }
      }

      if (allowedPattern && !allowedPattern.test(original)) {
        throw new BadRequestException(TAG_ERRORS.PATTERN_MISMATCH.message);
      }
    }
  }
}
