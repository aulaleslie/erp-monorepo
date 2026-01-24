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
  let saveMock: jest.Mock;
  let findMock: jest.Mock;
  let findOneMock: jest.Mock;
  let createMock: jest.Mock;
  let queryBuilderGetOneMock: jest.Mock;

  beforeEach(async () => {
    queryBuilderGetOneMock = jest.fn();
    const queryBuilderMock = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: queryBuilderGetOneMock,
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    saveMock = jest
      .fn()
      .mockImplementation((entity: DocumentNumberSettingEntity) =>
        Promise.resolve(entity),
      );
    findMock = jest.fn();
    findOneMock = jest.fn();
    createMock = jest.fn(
      (data: Partial<DocumentNumberSettingEntity>) =>
        ({
          ...data,
        }) as DocumentNumberSettingEntity,
    );

    // Mock Repository
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      create: createMock,
      save: saveMock,
      find: findMock,
      findOne: findOneMock,
    } as unknown as Repository<DocumentNumberSettingEntity>;

    // Mock EntityManager
    manager = {
      getRepository: jest.fn().mockReturnValue(repository),
      save: saveMock,
    } as unknown as EntityManager;

    // Mock DataSource
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (mgr: EntityManager) => Promise<unknown>) =>
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
      queryBuilderGetOneMock
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
      expect(saveMock).toHaveBeenCalled();
    });

    it('should increment counter within the same period', async () => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;

      queryBuilderGetOneMock.mockResolvedValue({
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

      queryBuilderGetOneMock.mockResolvedValue({
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
      queryBuilderGetOneMock.mockResolvedValue({
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
      queryBuilderGetOneMock.mockResolvedValue(null);

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
      findMock.mockResolvedValue(mockSettings);

      const result = await service.findAllSettings(tenantId);

      expect(result).toEqual(mockSettings);
      expect(findMock).toHaveBeenCalledWith({
        where: { tenantId },
        order: { documentKey: 'ASC' },
      });
    });

    it('findOneSetting should return existing settings', async () => {
      const mockSetting = { documentKey: 'type-1', tenantId };
      findOneMock.mockResolvedValue(mockSetting);

      const result = await service.findOneSetting(tenantId, 'type-1');

      expect(result).toEqual(mockSetting);
    });

    it('findOneSetting should return defaults if not found', async () => {
      findOneMock.mockResolvedValue(null);
      createMock.mockImplementation(
        (data: Partial<DocumentNumberSettingEntity>) =>
          ({
            ...data,
          }) as DocumentNumberSettingEntity,
      );

      const result = await service.findOneSetting(tenantId, 'sales.invoice');

      expect(result).toMatchObject({
        documentKey: 'sales.invoice',
        prefix: 'INV',
      });
    });

    it('findOneSetting should return defaults for sales.credit_note', async () => {
      findOneMock.mockResolvedValue(null);
      const result = await service.findOneSetting(
        tenantId,
        'sales.credit_note',
      );

      expect(result).toMatchObject({
        documentKey: 'sales.credit_note',
        prefix: 'CN',
        paddingLength: 6,
        includePeriod: true,
      });
    });

    it('updateSetting should update existing settings', async () => {
      const existing = { documentKey: 'type-1', prefix: 'OLD', tenantId };
      findOneMock.mockResolvedValue(existing);

      await service.updateSetting(tenantId, 'type-1', { prefix: 'NEW' });

      expect(existing.prefix).toBe('NEW');
      expect(saveMock).toHaveBeenCalled();
    });
  });
});
