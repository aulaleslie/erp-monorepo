import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DocumentNumberService } from './document-number.service';
import { DocumentNumberSettingEntity } from '../../database/entities/document-number-setting.entity';
import { InternalServerErrorException } from '@nestjs/common';

describe('DocumentNumberService', () => {
  let service: DocumentNumberService;
  let dataSource: DataSource;
  let manager: EntityManager;
  let repository: Repository<DocumentNumberSettingEntity>;

  beforeEach(async () => {
    // Mock Repository
    repository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      create: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((entity: DocumentNumberSettingEntity) =>
          Promise.resolve(entity),
        ),
      find: jest.fn(),
      findOne: jest.fn(),
    } as unknown as Repository<DocumentNumberSettingEntity>;

    // Mock EntityManager
    manager = {
      getRepository: jest.fn().mockReturnValue(repository),
      save: jest
        .fn()
        .mockImplementation((entity: DocumentNumberSettingEntity) =>
          Promise.resolve(entity),
        ),
    } as unknown as EntityManager;

    // Mock DataSource
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (mgr: EntityManager) => Promise<any>) =>
          cb(manager),
        ),
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentNumberService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<DocumentNumberService>(DocumentNumberService);
  });

  describe('getNextDocumentNumber', () => {
    const tenantId = 'tenant-1';
    const documentKey = 'sales.invoice';

    it('should generate number with default format when no settings exist', async () => {
      // First call: settings not found, then returned after creation
      (repository.createQueryBuilder().getOne as jest.Mock)
        .mockResolvedValueOnce(null) // First find
        .mockResolvedValueOnce({
          tenantId,
          documentKey,
          prefix: 'INV',
          paddingLength: 6,
          includePeriod: true,
          periodFormat: 'yyyy-MM',
          currentCounter: 0,
          lastPeriod: null,
        });

      const result = await service.getNextDocumentNumber(tenantId, documentKey);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const expected = `INV-${year}-${month}-000001`;

      expect(result).toBe(expected);
      expect(manager.save).toHaveBeenCalled();
    });

    it('should increment counter within the same period', async () => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;

      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue({
        tenantId,
        documentKey,
        prefix: 'INV',
        paddingLength: 6,
        includePeriod: true,
        periodFormat: 'yyyy-MM',
        currentCounter: 5,
        lastPeriod: period,
      });

      const result = await service.getNextDocumentNumber(tenantId, documentKey);

      expect(result).toBe(`INV-${period}-000006`);
    });

    it('should reset counter when period changes', async () => {
      const lastPeriod = '2025-12';
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, '0')}`;

      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue({
        tenantId,
        documentKey,
        prefix: 'INV',
        paddingLength: 6,
        includePeriod: true,
        periodFormat: 'yyyy-MM',
        currentCounter: 10,
        lastPeriod: lastPeriod,
      });

      const result = await service.getNextDocumentNumber(tenantId, documentKey);

      expect(result).toBe(`INV-${currentPeriod}-000001`);
    });

    it('should omit period when includePeriod is false', async () => {
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue({
        tenantId,
        documentKey,
        prefix: 'INV',
        paddingLength: 4,
        includePeriod: false,
        currentCounter: 9,
      });

      const result = await service.getNextDocumentNumber(tenantId, documentKey);

      expect(result).toBe('INV-0010');
    });

    it('should throw InternalServerErrorException if settings cannot be fetched after creation', async () => {
      (repository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.getNextDocumentNumber(tenantId, documentKey),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('settings management', () => {
    const tenantId = 'tenant-1';

    it('findAllSettings should return settings from repository', async () => {
      const mockSettings = [
        { documentKey: 'type-1' },
        { documentKey: 'type-2' },
      ];
      (repository.find as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockSettings);

      const result = await service.findAllSettings(tenantId);

      expect(result).toEqual(mockSettings);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { documentKey: 'ASC' },
      });
    });

    it('findOneSetting should return existing settings', async () => {
      const mockSetting = { documentKey: 'type-1', tenantId };
      (repository.findOne as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockSetting);

      const result = await service.findOneSetting(tenantId, 'type-1');

      expect(result).toEqual(mockSetting);
    });

    it('findOneSetting should return defaults if not found', async () => {
      (repository.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
      (repository.create as jest.Mock).mockImplementation((d) => d);

      const result = await service.findOneSetting(tenantId, 'sales.invoice');

      expect(result).toMatchObject({
        documentKey: 'sales.invoice',
        prefix: 'INV',
      });
    });

    it('updateSetting should update existing settings', async () => {
      const existing = { documentKey: 'type-1', prefix: 'OLD', tenantId };
      (repository.findOne as jest.Mock) = jest.fn().mockResolvedValue(existing);

      await service.updateSetting(tenantId, 'type-1', { prefix: 'NEW' } as any);

      expect(existing.prefix).toBe('NEW');
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
