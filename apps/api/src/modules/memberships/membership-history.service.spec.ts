import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { MembershipHistoryService } from './membership-history.service';
import { MembershipHistoryEntity } from '../../database/entities/membership-history.entity';
import {
  MembershipHistoryAction,
  MembershipStatus,
} from '@gym-monorepo/shared';

describe('MembershipHistoryService', () => {
  let service: MembershipHistoryService;
  let repo: Repository<MembershipHistoryEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipHistoryService,
        {
          provide: getRepositoryToken(MembershipHistoryEntity),
          useValue: {
            create: jest.fn().mockImplementation((dto: unknown) => dto),
            save: jest
              .fn()
              .mockImplementation((entity) =>
                Promise.resolve({ id: 'new-id', ...entity }),
              ),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MembershipHistoryService>(MembershipHistoryService);
    repo = module.get<Repository<MembershipHistoryEntity>>(
      getRepositoryToken(MembershipHistoryEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logHistory', () => {
    it('should create and save a history record', async () => {
      const membershipId = 'mem-1';
      const action = MembershipHistoryAction.CREATED;
      const data = {
        toStatus: MembershipStatus.ACTIVE,
        notes: 'Initial creation',
      };

      const result = await service.logHistory(membershipId, action, data);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          membershipId,
          action,
          toStatus: MembershipStatus.ACTIVE,
          notes: 'Initial creation',
        }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'new-id');
      expect(result.membershipId).toBe(membershipId);
    });

    it('should use provided EntityManager if available', async () => {
      const mockRepo = {
        create: jest.fn().mockImplementation((dto: unknown) => dto),
        save: jest
          .fn()
          .mockImplementation((entity) =>
            Promise.resolve({ id: 'managed-id', ...entity }),
          ),
      };
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockRepo),
      } as unknown as EntityManager;

      const membershipId = 'mem-2';
      const action = MembershipHistoryAction.FLAGGED;

      const result = await service.logHistory(
        membershipId,
        action,
        {},
        mockManager,
      );

      expect(mockManager.getRepository).toHaveBeenCalledWith(
        MembershipHistoryEntity,
      );
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'managed-id');
    });
  });

  describe('findByMembershipId', () => {
    it('should return history records for a specific membership', async () => {
      const membershipId = 'mem-1';
      const mockRecords = [{ id: '1' }, { id: '2' }];
      (repo.find as jest.Mock).mockResolvedValue(mockRecords);

      const result = await service.findByMembershipId(membershipId);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { membershipId },
          order: { performedAt: 'DESC' },
        }),
      );
      expect(result).toEqual(mockRecords);
    });
  });
});
