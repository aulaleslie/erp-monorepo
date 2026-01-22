import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DocumentStatus, TAG_ERRORS } from '@gym-monorepo/shared';
import {
  DocumentEntity,
  TagEntity,
  TagLinkEntity,
} from '../../database/entities';
import { TenantsService } from '../tenants/tenants.service';
import { TagAssignmentDto } from './dto/tag-assignment.dto';

interface TagSummary {
  id: string;
  name: string;
  usageCount: number;
}

interface TagAssignmentResult {
  assigned: TagSummary[];
}

interface TagRemovalResult {
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

  suggest(_tenantId: string, _query?: string): Promise<never[]> {
    return Promise.resolve([]);
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
      })),
    };
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

    await this.tagRepository.save(Array.from(tagsToUpdate.values()));

    return {
      removed: Array.from(tagsToUpdate.values()).map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
    };
  }

  private normalizeTags(tags: string[]): Array<{
    normalized: string;
    original: string;
  }> {
    const normalizedMap = new Map<string, string>();

    for (const raw of tags ?? []) {
      if (!raw) {
        continue;
      }

      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }

      const normalized = trimmed.toLowerCase();
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, trimmed);
      }
    }

    return Array.from(normalizedMap.entries()).map(
      ([normalized, original]) => ({
        normalized,
        original,
      }),
    );
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
