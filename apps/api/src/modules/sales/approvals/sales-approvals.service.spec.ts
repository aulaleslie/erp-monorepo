import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DocumentStatus } from '@gym-monorepo/shared';
import {
  DocumentApprovalEntity,
  DocumentEntity,
  SalesApprovalEntity,
  SalesApprovalLevelEntity,
  UserEntity,
  TenantUserEntity,
} from '../../../database/entities';
import { DocumentsService } from '../../documents/documents.service';
import { SalesApprovalsService } from './sales-approvals.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('SalesApprovalsService', () => {
  let service: SalesApprovalsService;
  let levelRepo: Repository<SalesApprovalLevelEntity>;
  let documentsService: DocumentsService;
  let dataSource: DataSource;

  const mockTenantId = 'tenant-1';
  const mockUserId = 'user-1';
  const mockDocumentId = 'doc-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesApprovalsService,
        {
          provide: getRepositoryToken(SalesApprovalEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SalesApprovalLevelEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DocumentApprovalEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TenantUserEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DocumentsService,
          useValue: {
            findOne: jest.fn(),
            submit: jest.fn(),
            approveStep: jest.fn(),
            reject: jest.fn(),
            requestRevision: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(
              (cb: (manager: unknown) => Promise<DocumentEntity>) =>
                cb({
                  create: jest.fn(
                    (_ent: unknown, val: Record<string, any>) => val,
                  ),
                  save: jest.fn((val: Record<string, any>) => val),
                  findOne: jest.fn(),
                  update: jest.fn(),
                }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<SalesApprovalsService>(SalesApprovalsService);
    levelRepo = module.get(getRepositoryToken(SalesApprovalLevelEntity));
    documentsService = module.get(DocumentsService);
    dataSource = module.get(DataSource);
  });

  describe('submit', () => {
    it('should throw error if no approval levels configured', async () => {
      jest.spyOn(documentsService, 'findOne').mockResolvedValue({
        documentKey: 'sales.order',
      } as unknown as DocumentEntity);
      jest.spyOn(levelRepo, 'find').mockResolvedValue([]);

      await expect(
        service.submit(mockDocumentId, mockTenantId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create approval records for each level', async () => {
      const mockDocument = {
        id: mockDocumentId,
        documentKey: 'sales.order',
      } as unknown as DocumentEntity;
      jest.spyOn(documentsService, 'findOne').mockResolvedValue(mockDocument);
      jest
        .spyOn(levelRepo, 'find')
        .mockResolvedValue([
          { levelIndex: 0 } as any,
          { levelIndex: 1 } as any,
        ]);
      jest.spyOn(documentsService, 'submit').mockResolvedValue(mockDocument);

      const result = await service.submit(
        mockDocumentId,
        mockTenantId,
        mockUserId,
      );

      expect(documentsService.submit).toHaveBeenCalledWith(
        mockDocumentId,
        mockTenantId,
        mockUserId,
      );
      expect(result).toBe(mockDocument);
    });
  });

  describe('approve', () => {
    it('should allow approval if user has correct role', async () => {
      const mockDocument = {
        id: mockDocumentId,
        status: DocumentStatus.SUBMITTED,
        documentKey: 'sales.order',
      };
      jest
        .spyOn(documentsService, 'findOne')
        .mockResolvedValue(mockDocument as unknown as DocumentEntity);

      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ levelIndex: 0 }) // currentApproval
          .mockResolvedValueOnce({
            levelIndex: 0,
            roles: [{ roleId: 'role-1' }],
          }) // level
          .mockResolvedValueOnce({
            tenantId: mockTenantId,
            userId: mockUserId,
            roleId: 'role-1',
          }), // tenantUser
        save: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (cb: (m: any) => Promise<DocumentEntity>) => cb(manager),
      );

      await service.approve(mockDocumentId, 'Notes', mockTenantId, mockUserId);

      expect(documentsService.approveStep).toHaveBeenCalledWith(
        mockDocumentId,
        0,
        'Notes',
        mockTenantId,
        mockUserId,
      );
    });

    it('should throw Forbidden if user has wrong role', async () => {
      const mockDocument = {
        id: mockDocumentId,
        status: DocumentStatus.SUBMITTED,
        documentKey: 'sales.order',
      };
      jest
        .spyOn(documentsService, 'findOne')
        .mockResolvedValue(mockDocument as unknown as DocumentEntity);

      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ levelIndex: 0 }) // currentApproval
          .mockResolvedValueOnce({
            levelIndex: 0,
            roles: [{ roleId: 'role-1' }],
          }) // level
          .mockResolvedValueOnce({
            tenantId: mockTenantId,
            userId: mockUserId,
            roleId: 'role-wrong',
          }) // tenantUser
          .mockResolvedValueOnce({ isSuperAdmin: false }), // user
      };
      (dataSource.transaction as jest.Mock).mockImplementation(
        (cb: (m: any) => Promise<DocumentEntity>) => cb(manager),
      );

      await expect(
        service.approve(mockDocumentId, 'Notes', mockTenantId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow approval if user is Super Admin despite wrong role', async () => {
      const mockDocument = {
        id: mockDocumentId,
        status: DocumentStatus.SUBMITTED,
        documentKey: 'sales.order',
      };
      jest
        .spyOn(documentsService, 'findOne')
        .mockResolvedValue(mockDocument as unknown as DocumentEntity);

      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ levelIndex: 0 }) // currentApproval
          .mockResolvedValueOnce({
            levelIndex: 0,
            roles: [{ roleId: 'role-1' }],
          }) // level
          .mockResolvedValueOnce({
            tenantId: mockTenantId,
            userId: mockUserId,
            roleId: 'role-wrong',
          }) // tenantUser
          .mockResolvedValueOnce({ isSuperAdmin: true }), // super admin user
        save: jest.fn(),
      };
      (dataSource.transaction as jest.Mock).mockImplementation(
        (cb: (m: any) => Promise<DocumentEntity>) => cb(manager),
      );

      await service.approve(mockDocumentId, 'Notes', mockTenantId, mockUserId);

      expect(documentsService.approveStep).toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return levels with roles', async () => {
      const mockResult = [
        { levelIndex: 0, roles: [{ role: { name: 'Admin' } }] },
      ] as any;
      jest.spyOn(levelRepo, 'find').mockResolvedValue(mockResult);

      const result = await service.getConfig(mockTenantId, 'sales.order');

      expect(levelRepo.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, documentKey: 'sales.order' },
        order: { levelIndex: 'ASC' },
        relations: { roles: { role: true } },
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('updateConfig', () => {
    it('should delete existing config and create new one', async () => {
      const dto = {
        documentKey: 'sales.order',
        levels: [
          { levelIndex: 0, roleIds: ['role-1'], isActive: true },
          { levelIndex: 1, roleIds: ['role-2'], isActive: false },
        ],
      };

      const manager = {
        find: jest
          .fn()
          .mockResolvedValue([{ id: 'level-old-1' }, { id: 'level-old-2' }]),
        delete: jest.fn(),
        create: jest.fn((entity, data) => ({ ...data, id: 'new-id' })),
        save: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (cb: (m: any) => Promise<DocumentEntity>) => cb(manager),
      );

      // Mock getConfig to return result
      jest.spyOn(service, 'getConfig').mockResolvedValue([] as any);

      await service.updateConfig(mockTenantId, dto, mockUserId);

      // Delete flow
      expect(manager.find).toHaveBeenCalledWith(SalesApprovalLevelEntity, {
        where: { tenantId: mockTenantId, documentKey: dto.documentKey },
      });
      expect(manager.delete).toHaveBeenCalledWith(
        'SalesApprovalLevelRoleEntity',
        {
          salesApprovalLevelId: 'level-old-1',
        },
      );
      expect(manager.delete).toHaveBeenCalledWith(SalesApprovalLevelEntity, {
        tenantId: mockTenantId,
        documentKey: dto.documentKey,
      });

      // Create flow
      expect(manager.create).toHaveBeenCalledWith(SalesApprovalLevelEntity, {
        tenantId: mockTenantId,
        documentKey: dto.documentKey,
        levelIndex: 0,
        isActive: true,
        createdBy: mockUserId,
      });
      expect(manager.create).toHaveBeenCalledWith(
        'SalesApprovalLevelRoleEntity',
        {
          salesApprovalLevelId: 'new-id',
          roleId: 'role-1',
        },
      );

      expect(manager.create).toHaveBeenCalledWith(SalesApprovalLevelEntity, {
        tenantId: mockTenantId,
        documentKey: dto.documentKey,
        levelIndex: 1,
        isActive: false,
        createdBy: mockUserId,
      });
    });
  });
});
