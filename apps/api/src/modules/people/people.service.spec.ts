import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { PeopleService } from './people.service';
import { PeopleEntity } from '../../database/entities';
import { TenantCountersService } from '../tenant-counters/tenant-counters.service';
import { PEOPLE_ERRORS, PeopleStatus, PeopleType } from '@gym-monorepo/shared';
import { PeopleQueryDto } from './dto/people-query.dto';
import { CreatePeopleDto } from './dto/create-people.dto';
import { UpdatePeopleDto } from './dto/update-people.dto';
import * as pagination from '../../common/dto/pagination.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const buildQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('PeopleService', () => {
  let service: PeopleService;
  let peopleRepository: MockRepository<PeopleEntity>;
  let tenantCountersService: { getNextPeopleCode: jest.Mock };

  beforeEach(async () => {
    peopleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    tenantCountersService = {
      getNextPeopleCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeopleService,
        {
          provide: getRepositoryToken(PeopleEntity),
          useValue: peopleRepository,
        },
        {
          provide: TenantCountersService,
          useValue: tenantCountersService,
        },
      ],
    }).compile();

    service = module.get<PeopleService>(PeopleService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findAll', () => {
    it('defaults status to ACTIVE when omitted', async () => {
      const items = [{ id: 'person-1' }] as PeopleEntity[];
      const qb = buildQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      peopleRepository.createQueryBuilder!.mockReturnValue(qb);

      const calculateSkipSpy = jest.spyOn(pagination, 'calculateSkip');
      const paginateSpy = jest.spyOn(pagination, 'paginate');

      const result = await service.findAll('tenant-1', {} as PeopleQueryDto);

      expect(peopleRepository.createQueryBuilder).toHaveBeenCalledWith(
        'people',
      );
      expect(qb.where).toHaveBeenCalledWith('people.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('people.status = :status', {
        status: PeopleStatus.ACTIVE,
      });
      expect(calculateSkipSpy).toHaveBeenCalledWith(1, 10);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(paginateSpy).toHaveBeenCalledWith(items, 1, 1, 10);
      expect(result.items).toEqual(items);
    });

    it('filters by type/status/search and paginates using calculateSkip', async () => {
      const items = [{ id: 'person-2' }] as PeopleEntity[];
      const qb = buildQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([items, 2]);
      peopleRepository.createQueryBuilder!.mockReturnValue(qb);

      const calculateSkipSpy = jest.spyOn(pagination, 'calculateSkip');
      const paginateSpy = jest.spyOn(pagination, 'paginate');

      const query: PeopleQueryDto = {
        type: PeopleType.STAFF,
        status: PeopleStatus.INACTIVE,
        search: '  Alice  ',
        page: 2,
        limit: 5,
      };

      const result = await service.findAll('tenant-1', query);

      expect(qb.andWhere).toHaveBeenCalledWith('people.type = :type', {
        type: PeopleType.STAFF,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('people.status = :status', {
        status: PeopleStatus.INACTIVE,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(people.code ILIKE :search OR people.fullName ILIKE :search OR people.email ILIKE :search OR people.phone ILIKE :search)',
        { search: '%Alice%' },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('people.createdAt', 'DESC');
      expect(calculateSkipSpy).toHaveBeenCalledWith(2, 5);
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(paginateSpy).toHaveBeenCalledWith(items, 2, 2, 5);
      expect(result.items).toEqual(items);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException with People error when missing', async () => {
      peopleRepository.findOne!.mockResolvedValue(null);

      try {
        await service.findOne('tenant-1', 'person-1');
        throw new Error('Expected NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toBe(
          PEOPLE_ERRORS.NOT_FOUND.message,
        );
      }
    });
  });

  describe('create', () => {
    it('generates code server-side and normalizes defaults', async () => {
      const created = { id: 'person-1' } as PeopleEntity;
      tenantCountersService.getNextPeopleCode.mockResolvedValue('CUS-000001');
      peopleRepository.create!.mockReturnValue(created);
      peopleRepository.save!.mockResolvedValue(created);

      const dto = {
        fullName: '  Jane Doe  ',
        email: '  Foo@Bar.com ',
        phone: '0812 345-678',
        code: 'CLIENT',
      } as CreatePeopleDto & { code?: string };

      const result = await service.create('tenant-1', dto);

      expect(tenantCountersService.getNextPeopleCode).toHaveBeenCalledWith(
        'tenant-1',
        PeopleType.CUSTOMER,
      );
      expect(peopleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          type: PeopleType.CUSTOMER,
          code: 'CUS-000001',
          fullName: 'Jane Doe',
          email: 'foo@bar.com',
          phone: '+62812345678',
          status: PeopleStatus.ACTIVE,
          tags: [],
          department: null,
        }),
      );
      expect(result).toBe(created);
    });

    it.each([
      ['0812 345 678', '+62812345678'],
      ['62 812 345 678', '+62812345678'],
      ['+62 (812) 345-678', '+62812345678'],
    ])('normalizes phone %s to %s', async (input, expected) => {
      const created = { id: 'person-2' } as PeopleEntity;
      tenantCountersService.getNextPeopleCode.mockResolvedValue('CUS-000002');
      peopleRepository.create!.mockReturnValue(created);
      peopleRepository.save!.mockResolvedValue(created);

      await service.create('tenant-1', {
        fullName: 'Phone Test',
        phone: input,
      });

      expect(peopleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: expected,
        }),
      );
    });

    it('rejects invalid phone numbers with validation error details', async () => {
      const dto = {
        fullName: 'Invalid Phone',
        phone: '12345',
      } as CreatePeopleDto;

      try {
        await service.create('tenant-1', dto);
        throw new Error('Expected BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          message: string;
          errors?: Record<string, string[]>;
        };
        expect(response.message).toBe('Validation failed');
        expect(response.errors?.phone).toEqual([
          PEOPLE_ERRORS.INVALID_PHONE.message,
        ]);
      }
    });

    it('rejects duplicate email with People error', async () => {
      peopleRepository.findOne!.mockResolvedValueOnce({
        id: 'person-dup',
      });

      try {
        await service.create('tenant-1', {
          fullName: 'Dup Email',
          email: 'dup@example.com',
        });
        throw new Error('Expected ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).message).toBe(
          PEOPLE_ERRORS.DUPLICATE_EMAIL.message,
        );
      }
    });

    it('rejects duplicate phone with People error', async () => {
      peopleRepository
        .findOne!.mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'person-dup' });

      try {
        await service.create('tenant-1', {
          fullName: 'Dup Phone',
          email: 'unique@example.com',
          phone: '0812 333 444',
        });
        throw new Error('Expected ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).message).toBe(
          PEOPLE_ERRORS.DUPLICATE_PHONE.message,
        );
      }
    });
  });

  describe('update', () => {
    it('normalizes email/phone and keeps type immutable while honoring excludeId', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.CUSTOMER,
        fullName: 'Jane',
        email: 'old@example.com',
        phone: '+628111',
        status: PeopleStatus.ACTIVE,
        tags: ['vip'],
        department: null,
      } as PeopleEntity;

      peopleRepository
        .findOne!.mockResolvedValueOnce(person)
        .mockResolvedValueOnce(person)
        .mockResolvedValueOnce(person);
      peopleRepository.save!.mockResolvedValue(person);

      const result = await service.update('tenant-1', 'person-1', {
        email: ' NEW@Email.com ',
        phone: '62 812 333',
        type: PeopleType.STAFF,
      } as UpdatePeopleDto & { type?: PeopleType });

      expect(peopleRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: 'person-1', tenantId: 'tenant-1' },
      });
      expect(peopleRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { tenantId: 'tenant-1', email: 'new@email.com' },
      });
      expect(peopleRepository.findOne).toHaveBeenNthCalledWith(3, {
        where: { tenantId: 'tenant-1', phone: '+62812333' },
      });
      expect(result.email).toBe('new@email.com');
      expect(result.phone).toBe('+62812333');
      expect(result.type).toBe(PeopleType.CUSTOMER);
    });

    it('updates status/tags/department for staff records', async () => {
      const person = {
        id: 'person-2',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
        fullName: 'Staff Member',
        email: null,
        phone: null,
        status: PeopleStatus.ACTIVE,
        tags: ['existing'],
        department: 'Front Desk',
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      peopleRepository.save!.mockResolvedValue(person);

      const result = await service.update('tenant-1', 'person-2', {
        status: PeopleStatus.INACTIVE,
        tags: null,
        department: 'Ops',
      } as unknown as UpdatePeopleDto);

      expect(result.status).toBe(PeopleStatus.INACTIVE);
      expect(result.tags).toEqual([]);
      expect(result.department).toBe('Ops');
    });

    it('clears department updates for non-staff records', async () => {
      const person = {
        id: 'person-3',
        tenantId: 'tenant-1',
        type: PeopleType.CUSTOMER,
        fullName: 'Customer',
        email: null,
        phone: null,
        status: PeopleStatus.ACTIVE,
        tags: [],
        department: 'Legacy',
      } as unknown as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      peopleRepository.save!.mockResolvedValue(person);

      const result = await service.update('tenant-1', 'person-3', {
        department: 'Sales',
      } as UpdatePeopleDto);

      expect(result.department).toBeNull();
    });
  });

  describe('remove', () => {
    it('soft deletes staff and unlinks userId', async () => {
      const person = {
        id: 'person-4',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
        userId: 'user-1',
        status: PeopleStatus.ACTIVE,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      peopleRepository.save!.mockResolvedValue(person);

      await service.remove('tenant-1', 'person-4');

      expect(person.userId).toBeNull();
      expect(person.status).toBe(PeopleStatus.INACTIVE);
      expect(peopleRepository.save).toHaveBeenCalledWith(person);
    });
  });
});
