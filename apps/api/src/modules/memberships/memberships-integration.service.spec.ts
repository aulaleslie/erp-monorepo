import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsIntegrationService } from './memberships-integration.service';
import { EntityManager } from 'typeorm';
import {
  DocumentEntity,
  MembershipEntity,
  DocumentRelationEntity,
} from '../../database/entities';
import { DocumentRelationType } from '@gym-monorepo/shared';
import { MembershipHistoryService } from './membership-history.service';
import { MembershipHistoryAction } from '@gym-monorepo/shared';
import { PtSessionPackagesIntegrationService } from '../pt-session-packages/pt-session-packages-integration.service';

describe('MembershipsIntegrationService', () => {
  let service: MembershipsIntegrationService;
  let manager: Partial<EntityManager>;
  let historyService: Partial<MembershipHistoryService>;
  let ptIntegrationService: Partial<PtSessionPackagesIntegrationService>;

  beforeEach(async () => {
    historyService = {
      logHistory: jest.fn(),
    };
    ptIntegrationService = {
      createIncludedPackage: jest.fn(),
      processSalesInvoice: jest.fn(),
      processCreditNote: jest.fn(),
    };
    manager = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      getRepository: jest.fn().mockReturnValue({
        create: (data: unknown) => data,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsIntegrationService,
        { provide: MembershipHistoryService, useValue: historyService },
        {
          provide: PtSessionPackagesIntegrationService,
          useValue: ptIntegrationService,
        },
      ],
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

      expect(historyService.logHistory).toHaveBeenCalledWith(
        'mem-1',
        MembershipHistoryAction.FLAGGED,
        expect.objectContaining({
          toStatus: 'ACTIVE',
          notes: expect.stringContaining('CN-001') as unknown as string,
        }),
        manager,
      );
    });
  });
});
