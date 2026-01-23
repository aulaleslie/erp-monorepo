import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { DocumentStatus, TAG_ERRORS } from '@gym-monorepo/shared';
import {
  DocumentEntity,
  TagEntity,
  TagLinkEntity,
  TenantEntity,
} from '../../database/entities';
import { TenantsService } from '../tenants/tenants.service';
import { TagsService } from './tags.service';
import { TagAssignmentDto } from './dto/tag-assignment.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const buildMockRepository = <
  T extends ObjectLiteral = any,
>(): MockRepository<T> => ({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const toTagEntity = (value: Partial<TagEntity>): TagEntity =>
  value as unknown as TagEntity;

const toTagLinkEntity = (value: Partial<TagLinkEntity>): TagLinkEntity =>
  value as unknown as TagLinkEntity;

describe('TagsService', () => {
  let service: TagsService;
  let tagRepository: MockRepository<TagEntity>;
  let tagLinkRepository: MockRepository<TagLinkEntity>;
  let tenantsService: { getTenantById: jest.Mock };
  let documentRepository: Partial<Record<'findOne', jest.Mock>>;
  const baseTenant = {
    id: 'tenant-1',
    tagMaxLength: null,
    tagAllowedPattern: null,
  } as TenantEntity;

  beforeEach(async () => {
    tagRepository = buildMockRepository();
    tagLinkRepository = buildMockRepository();
    tenantsService = {
      getTenantById: jest.fn().mockResolvedValue(baseTenant),
    };
    documentRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(TagEntity),
          useValue: tagRepository,
        },
        {
          provide: getRepositoryToken(TagLinkEntity),
          useValue: tagLinkRepository,
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: documentRepository,
        },
        {
          provide: TenantsService,
          useValue: tenantsService,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('suggest', () => {
    it('returns tag summaries from the repository', async () => {
      const mockTags = [
        toTagEntity({
          id: '1',
          name: 'Alpha',
          usageCount: 5,
          lastUsedAt: new Date(),
        }),
        toTagEntity({
          id: '2',
          name: 'Beta',
          usageCount: 3,
          lastUsedAt: new Date(),
        }),
      ];

      tagRepository.find!.mockResolvedValue(mockTags);

      const result = await service.suggest('tenant-1', 'al');

      expect(tagRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({
              tenantId: 'tenant-1',
              name: expect.anything() as unknown,
            }),
          ]) as unknown,
          take: 10,
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Alpha',
        usageCount: 5,
        lastUsedAt: expect.any(Date) as unknown as Date,
      });
    });

    it('returns an empty array when no tags are found', async () => {
      tagRepository.find!.mockResolvedValue([]);
      const result = await service.suggest('tenant-1', 'foo');
      expect(result).toEqual([]);
      expect(tagRepository.find).toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    it('creates new tags and links when missing', async () => {
      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-1',
        tags: ['Alpha', ' Beta ', 'alpha'],
      };

      tagRepository.find!.mockResolvedValue([] as TagEntity[]);
      tagLinkRepository.find!.mockResolvedValue([] as TagLinkEntity[]);
      tagRepository.create!.mockImplementation((value: Partial<TagEntity>) => ({
        id: `tag-${value.nameNormalized}`,
        ...value,
      }));
      tagRepository.save!.mockImplementation(
        (entities: TagEntity | TagEntity[]) => Promise.resolve(entities),
      );
      tagLinkRepository.create!.mockImplementation(
        (value: Partial<TagLinkEntity>) => ({
          id: `link-${value.tagId}`,
          ...value,
        }),
      );
      tagLinkRepository.save!.mockImplementation(
        (entities: TagLinkEntity | TagLinkEntity[]) =>
          Promise.resolve(entities),
      );

      const result = await service.assign('tenant-1', dto);

      expect(tagRepository.find).toHaveBeenCalled();
      const mockCalls = (tagRepository.find as jest.Mock).mock.calls as Array<
        [
          {
            where: { tenantId: string; nameNormalized: string[] };
          },
        ]
      >;
      const findCallArg = mockCalls[0][0];
      expect(findCallArg.where).toEqual(
        expect.objectContaining({
          tenantId: 'tenant-1',
        }),
      );
      expect(tagLinkRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          resourceType: 'document',
          resourceId: 'doc-1',
        },
      });
      expect(tagLinkRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenantId: 'tenant-1',
            resourceType: 'document',
            resourceId: 'doc-1',
          }),
        ]),
      );
      expect(result.assigned).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Alpha', usageCount: 1 }),
          expect.objectContaining({ name: 'Beta', usageCount: 1 }),
        ]),
      );
    });

    it('does not create additional links for already assigned tags', async () => {
      const existingTag = toTagEntity({
        id: 'tag-alpha',
        tenantId: 'tenant-1',
        name: 'Alpha',
        nameNormalized: 'alpha',
        usageCount: 2,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const existingLink = toTagLinkEntity({
        id: 'link-alpha',
        tenantId: 'tenant-1',
        tagId: 'tag-alpha',
        resourceType: 'document',
        resourceId: 'doc-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-1',
        tags: ['Alpha'],
      };

      tagRepository.find!.mockResolvedValue([existingTag] as TagEntity[]);
      tagLinkRepository.find!.mockResolvedValue([
        existingLink,
      ] as TagLinkEntity[]);

      await expect(service.assign('tenant-1', dto)).resolves.toEqual({
        assigned: [],
      });
      expect(tagLinkRepository.save).not.toHaveBeenCalled();
      expect(tagRepository.save).not.toHaveBeenCalled();
    });

    it('enforces tenant max length rules', async () => {
      tenantsService.getTenantById.mockResolvedValueOnce({
        ...baseTenant,
        tagMaxLength: 3,
      } as TenantEntity);

      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-1',
        tags: ['long'],
      };

      await expect(service.assign('tenant-1', dto)).rejects.toThrow(
        TAG_ERRORS.NAME_TOO_LONG.message,
      );
    });

    it('enforces tenant pattern rules', async () => {
      tenantsService.getTenantById.mockResolvedValueOnce({
        ...baseTenant,
        tagAllowedPattern: '^[a-z]+$',
      } as TenantEntity);

      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-1',
        tags: ['123'],
      };

      await expect(service.assign('tenant-1', dto)).rejects.toThrow(
        TAG_ERRORS.PATTERN_MISMATCH.message,
      );
    });

    it('blocks assignment when the document is locked', async () => {
      documentRepository.findOne?.mockResolvedValueOnce({
        status: DocumentStatus.APPROVED,
      } as unknown as DocumentEntity);

      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-locked',
        tags: ['tag'],
      };

      await expect(service.assign('tenant-1', dto)).rejects.toThrow(
        TAG_ERRORS.LOCKED.message,
      );
    });

    it('throws when normalized values are empty', async () => {
      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-1',
        tags: ['   '],
      };

      await expect(service.assign('tenant-1', dto)).rejects.toThrow(
        TAG_ERRORS.INVALID_NAME.message,
      );
    });
  });

  describe('remove', () => {
    it('removes links and decrements usage counts', async () => {
      const tag = toTagEntity({
        id: 'tag-alpha',
        tenantId: 'tenant-1',
        name: 'Alpha',
        nameNormalized: 'alpha',
        usageCount: 3,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const link = toTagLinkEntity({
        id: 'link-alpha',
        tenantId: 'tenant-1',
        tagId: 'tag-alpha',
        resourceType: 'document',
        resourceId: 'doc-1',
        tag,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-1',
        tags: ['Alpha'],
      };

      tagRepository.find!.mockResolvedValue([tag] as TagEntity[]);
      tagLinkRepository.find!.mockResolvedValue([link] as TagLinkEntity[]);
      tagRepository.save!.mockImplementation(
        (entities: TagEntity | TagEntity[]) => Promise.resolve(entities),
      );
      tagLinkRepository.remove!.mockImplementation(
        (entities: TagLinkEntity[]) => Promise.resolve(entities),
      );

      const result = await service.remove('tenant-1', dto);

      expect(tagLinkRepository.remove).toHaveBeenCalledWith([link]);
      expect(tagRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'tag-alpha',
            usageCount: 2,
          }),
        ]),
      );
      expect(result).toEqual({
        removed: [
          {
            id: 'tag-alpha',
            name: 'Alpha',
          },
        ],
      });
    });

    it('returns empty if no tags exist', async () => {
      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'unknown',
        tags: ['Unknown'],
      };

      tagRepository.find!.mockResolvedValue([] as TagEntity[]);

      const result = await service.remove('tenant-1', dto);

      expect(result).toEqual({ removed: [] });
      expect(tagLinkRepository.remove).not.toHaveBeenCalled();
    });

    it('blocks removal when the document is locked', async () => {
      documentRepository.findOne?.mockResolvedValueOnce({
        status: DocumentStatus.POSTED,
      } as unknown as DocumentEntity);

      const dto: TagAssignmentDto = {
        resourceType: 'document',
        resourceId: 'doc-locked',
        tags: ['Alpha'],
      };

      await expect(service.remove('tenant-1', dto)).rejects.toThrow(
        TAG_ERRORS.LOCKED.message,
      );
    });
  });
});
