import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { PeopleType } from '@gym-monorepo/shared';
import { TenantCountersService } from './tenant-counters.service';
import { TenantCounterEntity } from '../../database/entities';

type TransactionCallback<T = unknown> = (manager: {
  getRepository: () => Repository<TenantCounterEntity>;
}) => Promise<T>;

const mockDataSource = () => ({
  transaction: jest.fn() as jest.Mock<
    Promise<unknown>,
    [TransactionCallback<unknown>]
  >,
});

const mockRepository = () => ({
  createQueryBuilder: jest.fn(),
  save: jest.fn(),
});

const buildSelectBuilder = (results: Array<TenantCounterEntity | null>) => {
  const builder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  results.forEach((result) => {
    builder.getOne.mockResolvedValueOnce(result);
  });

  return builder;
};

const buildInsertBuilder = () => ({
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  orIgnore: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({}),
});

describe('TenantCountersService', () => {
  let service: TenantCountersService;
  let dataSource: { transaction: jest.Mock };
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantCountersService,
        {
          provide: DataSource,
          useFactory: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TenantCountersService>(TenantCountersService);
    dataSource = module.get(DataSource);
    repository = mockRepository();
  });

  it('should generate the next code for an existing counter', async () => {
    const tenantId = 'tenant-1';
    const counter = {
      id: 'counter-1',
      tenantId,
      key: 'people.customer',
      value: 5,
    } as TenantCounterEntity;
    const selectBuilder = buildSelectBuilder([counter]);

    repository.createQueryBuilder.mockReturnValue(selectBuilder);
    repository.save.mockResolvedValue({ ...counter, value: 6 });

    dataSource.transaction.mockImplementation((cb: TransactionCallback) =>
      cb({
        getRepository: () =>
          repository as unknown as Repository<TenantCounterEntity>,
      }),
    );

    const code = await service.getNextPeopleCode(tenantId, PeopleType.CUSTOMER);

    expect(code).toBe('CUS-000006');
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ value: 6 }),
    );
  });

  it('should initialize the counter when missing', async () => {
    const tenantId = 'tenant-2';
    const counter = {
      id: 'counter-2',
      tenantId,
      key: 'people.staff',
      value: 0,
    } as TenantCounterEntity;

    const selectBuilder = buildSelectBuilder([null, counter]);
    const insertBuilder = buildInsertBuilder();

    repository.createQueryBuilder
      .mockImplementationOnce(() => selectBuilder)
      .mockImplementationOnce(() => insertBuilder)
      .mockImplementationOnce(() => selectBuilder);

    repository.save.mockResolvedValue({ ...counter, value: 1 });

    dataSource.transaction.mockImplementation((cb: TransactionCallback) =>
      cb({
        getRepository: () =>
          repository as unknown as Repository<TenantCounterEntity>,
      }),
    );

    const code = await service.getNextPeopleCode(tenantId, PeopleType.STAFF);

    expect(insertBuilder.execute).toHaveBeenCalled();
    expect(code).toBe('STF-000001');
  });
});
