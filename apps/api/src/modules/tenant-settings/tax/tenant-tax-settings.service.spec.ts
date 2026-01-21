import { Test, TestingModule } from '@nestjs/testing';
import { TenantTaxSettingsService } from './tenant-tax-settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantEntity } from '../../../database/entities/tenant.entity';
import {
  TaxEntity,
  TaxStatus,
  TaxType,
} from '../../../database/entities/tax.entity';
import { TenantTaxEntity } from '../../../database/entities/tenant-tax.entity';
import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockTenantRepository = () => ({
  findOne: jest.fn(),
});

const mockTaxRepository = () => ({
  find: jest.fn(),
});

const mockTenantTaxRepository = () => ({
  find: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn(),
});

type TransactionCallback<T = unknown> = (manager: EntityManager) => Promise<T>;
type TransactionIsolationLevel = string;

type TransactionFn = {
  <T = unknown>(runInTransaction: TransactionCallback<T>): Promise<T>;
  <T = unknown>(
    isolationLevel: TransactionIsolationLevel,
    runInTransaction: TransactionCallback<T>,
  ): Promise<T>;
};

const runTransaction =
  (manager: EntityManager): TransactionFn =>
  <T>(
    isolationOrCallback: TransactionIsolationLevel | TransactionCallback<T>,
    maybeCallback?: TransactionCallback<T>,
  ) => {
    const callback =
      typeof isolationOrCallback === 'function'
        ? isolationOrCallback
        : maybeCallback;

    if (!callback) {
      throw new Error('Missing transaction callback');
    }

    return callback(manager);
  };

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = {
  [P in keyof Repository<T>]: jest.Mock;
};

describe('TenantTaxSettingsService', () => {
  let service: TenantTaxSettingsService;
  let tenantRepository: MockRepository<TenantEntity>;
  let taxRepository: MockRepository<TaxEntity>;
  let tenantTaxRepository: MockRepository<TenantTaxEntity>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantTaxSettingsService,
        {
          provide: getRepositoryToken(TenantEntity),
          useFactory: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(TaxEntity),
          useFactory: mockTaxRepository,
        },
        {
          provide: getRepositoryToken(TenantTaxEntity),
          useFactory: mockTenantTaxRepository,
        },
        {
          provide: DataSource,
          useFactory: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TenantTaxSettingsService>(TenantTaxSettingsService);
    tenantRepository = module.get(getRepositoryToken(TenantEntity));
    taxRepository = module.get(getRepositoryToken(TaxEntity));
    tenantTaxRepository = module.get(getRepositoryToken(TenantTaxEntity));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return settings for a taxable tenant', async () => {
      const tenantId = 'tenant-1';
      const tenant = { id: tenantId, isTaxable: true } as TenantEntity;
      const taxes = [
        {
          id: 'tax-1',
          name: 'VAT',
          code: 'VAT',
          rate: 10,
          type: TaxType.PERCENTAGE,
          status: TaxStatus.ACTIVE,
        },
        {
          id: 'tax-2',
          name: 'Service',
          code: 'SVC',
          rate: 5,
          type: TaxType.PERCENTAGE,
          status: TaxStatus.ACTIVE,
        },
      ] as TaxEntity[];
      const tenantTaxes = [
        { tenantId, taxId: 'tax-1', isDefault: true, tax: taxes[0] },
      ] as TenantTaxEntity[];

      tenantRepository.findOne.mockResolvedValue(tenant);
      taxRepository.find.mockResolvedValue(taxes);
      tenantTaxRepository.find.mockResolvedValue(tenantTaxes);

      const result = await service.getSettings(tenantId);

      expect(result.isTaxable).toBe(true);
      expect(result.selectedTaxIds).toEqual(['tax-1']);
      expect(result.defaultTaxId).toBe('tax-1');
      expect(result.taxes).toHaveLength(2);
      expect(result.taxes[0].id).toBe('tax-1');
      expect(result.taxes[0].isSelected).toBe(true);
      expect(result.taxes[0].isDefault).toBe(true);
      expect(result.taxes[1].id).toBe('tax-2');
      expect(result.taxes[1].isSelected).toBe(false);
      expect(result.taxes[1].isDefault).toBe(false);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      await expect(service.getSettings('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSettings', () => {
    it('should throw ConflictException if tenant is not taxable', async () => {
      // We mock the transaction execution to simulate the callback running
      const mockManager: jest.Mocked<Partial<EntityManager>> = {
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'tenant-1', isTaxable: false }),
      };

      dataSource.transaction.mockImplementation(
        runTransaction(mockManager as EntityManager),
      );

      await expect(
        service.updateSettings('tenant-1', { taxIds: [] }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update settings successfully', async () => {
      const tenantId = 'tenant-1';
      const taxIds = ['tax-1', 'tax-2'];
      const defaultTaxId = 'tax-1';

      const mockManager: jest.Mocked<Partial<EntityManager>> = {
        findOne: jest.fn().mockResolvedValue({ id: tenantId, isTaxable: true }),
        find: jest.fn().mockResolvedValue([
          { id: 'tax-1', status: TaxStatus.ACTIVE },
          { id: 'tax-2', status: TaxStatus.ACTIVE },
        ]),
        delete: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockReturnValue([{}]),
        save: jest.fn().mockResolvedValue([{}]),
      };

      dataSource.transaction.mockImplementation(
        runTransaction(mockManager as EntityManager),
      );

      await service.updateSettings(tenantId, { taxIds, defaultTaxId });

      expect(mockManager.delete).toHaveBeenCalledWith(TenantTaxEntity, {
        tenantId,
      });
      expect(mockManager.create).toHaveBeenCalledWith(TenantTaxEntity, [
        { tenantId, taxId: 'tax-1', isDefault: true },
        { tenantId, taxId: 'tax-2', isDefault: false },
      ]);
      expect(mockManager.save).toHaveBeenCalled();
    });
  });
});
