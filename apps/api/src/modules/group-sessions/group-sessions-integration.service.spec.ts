import { Test, TestingModule } from '@nestjs/testing';
import { GroupSessionsIntegrationService } from './group-sessions-integration.service';
import { EntityManager } from 'typeorm';
import {
  DocumentEntity,
  DocumentItemEntity,
  MemberEntity,
} from '../../database/entities';
import { ItemServiceKind } from '@gym-monorepo/shared';

describe('GroupSessionsIntegrationService', () => {
  let service: GroupSessionsIntegrationService;
  let manager: Partial<EntityManager>;

  beforeEach(async () => {
    manager = {
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((_entity: unknown, data: object) => data),
      save: jest
        .fn()
        .mockImplementation(
          (data: object): Promise<unknown> =>
            Promise.resolve({ id: 'new-id', ...data }),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupSessionsIntegrationService],
    }).compile();

    service = module.get<GroupSessionsIntegrationService>(
      GroupSessionsIntegrationService,
    );
  });

  describe('processSalesInvoice', () => {
    it('should create group sessions only for items with maxParticipants > 1', async () => {
      const tenantId = 'tenant-1';
      const personId = 'person-1';
      const document = {
        id: 'doc-1',
        tenantId,
        personId,
        number: 'INV-001',
        items: [
          {
            id: 'item-1',
            item: {
              id: 'prod-1',
              serviceKind: ItemServiceKind.PT_SESSION,
              maxParticipants: 1,
              name: 'Individual PT',
              sessionCount: 10,
            },
            lineTotal: 1000,
          } as unknown as DocumentItemEntity,
          {
            id: 'item-2',
            item: {
              id: 'prod-2',
              serviceKind: ItemServiceKind.PT_SESSION,
              maxParticipants: 2,
              name: 'Group PT',
              sessionCount: 5,
            },
            lineTotal: 500,
          } as unknown as DocumentItemEntity,
        ],
      } as DocumentEntity;

      const member = { id: 'member-1', personId, tenantId } as MemberEntity;
      (manager.findOne as jest.Mock).mockResolvedValue(member);

      await service.processSalesInvoice(
        document,
        manager as EntityManager,
        tenantId,
        'user-1',
      );

      // Should only call save for the group PT
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'prod-2',
          itemName: 'Group PT',
          totalSessions: 5,
          maxParticipants: 2,
        }),
      );
    });

    it('should NOT create group sessions for items where maxParticipants is undefined', async () => {
      const tenantId = 'tenant-1';
      const personId = 'person-1';
      const document = {
        id: 'doc-1',
        tenantId,
        personId,
        number: 'INV-001',
        items: [
          {
            id: 'item-1',
            item: {
              id: 'prod-1',
              serviceKind: ItemServiceKind.PT_SESSION,
              // maxParticipants undefined -> defaults to 1
              name: 'Individual PT',
              sessionCount: 10,
            },
            lineTotal: 1000,
          } as unknown as DocumentItemEntity,
        ],
      } as DocumentEntity;

      const member = { id: 'member-1', personId, tenantId } as MemberEntity;
      (manager.findOne as jest.Mock).mockResolvedValue(member);

      await service.processSalesInvoice(
        document,
        manager as EntityManager,
        tenantId,
        'user-1',
      );

      expect(manager.save).not.toHaveBeenCalled();
    });
  });
});
