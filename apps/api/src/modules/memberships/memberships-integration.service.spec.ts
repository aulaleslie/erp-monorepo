import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsIntegrationService } from './memberships-integration.service';
import { EntityManager } from 'typeorm';
import {
  DocumentEntity,
  MembershipEntity,
  DocumentRelationEntity,
} from '../../database/entities';
import { DocumentRelationType } from '@gym-monorepo/shared';

describe('MembershipsIntegrationService', () => {
  let service: MembershipsIntegrationService;
  let manager: Partial<EntityManager>;

  beforeEach(async () => {
    manager = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipsIntegrationService],
    }).compile();

    service = module.get<MembershipsIntegrationService>(
      MembershipsIntegrationService,
    );
  });

  describe('processCreditNote', () => {
    it('should flag memberships for review when linked to invoice', async () => {
      const creditNote = {
        id: 'cn-1',
        tenantId: 'tenant-1',
        number: 'CN-001',
      } as DocumentEntity;
      const relations = [
        {
          fromDocumentId: 'inv-1',
          toDocumentId: 'cn-1',
          relationType: DocumentRelationType.INVOICE_TO_CREDIT,
        } as DocumentRelationEntity,
      ];
      const memberships = [
        {
          id: 'mem-1',
          requiresReview: false,
          status: 'ACTIVE',
        } as MembershipEntity,
      ];

      (manager.find as jest.Mock)
        .mockResolvedValueOnce(relations) // First find: relations
        .mockResolvedValueOnce(memberships); // Second find: memberships

      await service.processCreditNote(creditNote, manager as EntityManager);

      expect(manager.find).toHaveBeenCalledWith(DocumentRelationEntity, {
        where: {
          toDocumentId: 'cn-1',
          tenantId: 'tenant-1',
          relationType: DocumentRelationType.INVOICE_TO_CREDIT,
        },
      });
      expect(manager.find).toHaveBeenCalledWith(MembershipEntity, {
        where: {
          sourceDocumentId: 'inv-1',
          tenantId: 'tenant-1',
        },
      });

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mem-1', requiresReview: true }),
      );
    });
  });
});
