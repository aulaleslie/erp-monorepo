import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { PeopleService } from './people.service';
import {
  PeopleEntity,
  UserEntity,
  TenantUserEntity,
  RoleEntity,
} from '../../database/entities';
import { TenantCountersService } from '../tenant-counters/tenant-counters.service';
import { PEOPLE_ERRORS, PeopleStatus, PeopleType } from '@gym-monorepo/shared';
import { PeopleQueryDto } from './dto/people-query.dto';
import { CreatePeopleDto } from './dto/create-people.dto';
import { UpdatePeopleDto } from './dto/update-people.dto';
import { InvitablePeopleQueryDto } from './dto/invitable-people-query.dto';
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
  select: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getMany: jest.fn(),
});

describe('PeopleService', () => {
  let service: PeopleService;
  let peopleRepository: MockRepository<PeopleEntity>;
  let usersRepository: MockRepository<UserEntity>;
  let tenantUserRepository: MockRepository<TenantUserEntity>;
  let roleRepository: MockRepository<RoleEntity>;
  let tenantCountersService: { getNextPeopleCode: jest.Mock };

  beforeEach(async () => {
    peopleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    usersRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    tenantUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    roleRepository = {
      findOne: jest.fn(),
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
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(TenantUserEntity),
          useValue: tenantUserRepository,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: roleRepository,
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

  describe('searchInvitablePeople', () => {
    it('filters across tenants, dedupes by contact key, and paginates', async () => {
      const qb = buildQueryBuilder();
      const matches = [
        {
          id: 'person-1',
          tenantId: 'tenant-2',
          type: PeopleType.CUSTOMER,
          fullName: 'Alpha',
          email: 'alpha@example.com',
          phone: null,
          tags: ['vip'],
          status: PeopleStatus.ACTIVE,
        },
        {
          id: 'person-2',
          tenantId: 'tenant-3',
          type: PeopleType.CUSTOMER,
          fullName: 'Alpha Clone',
          email: 'alpha@example.com',
          phone: '+628123',
          tags: ['dup'],
          status: PeopleStatus.ACTIVE,
        },
        {
          id: 'person-3',
          tenantId: 'tenant-4',
          type: PeopleType.SUPPLIER,
          fullName: 'Beta',
          email: null,
          phone: '+628124',
          tags: [],
          status: PeopleStatus.ACTIVE,
        },
        {
          id: 'person-4',
          tenantId: 'tenant-5',
          type: PeopleType.SUPPLIER,
          fullName: 'No Contact',
          email: null,
          phone: null,
          tags: [],
          status: PeopleStatus.ACTIVE,
        },
      ] as PeopleEntity[];
      qb.getMany.mockResolvedValue(matches);
      peopleRepository.createQueryBuilder!.mockReturnValue(qb);

      const calculateSkipSpy = jest.spyOn(pagination, 'calculateSkip');

      const result = await service.searchInvitablePeople('tenant-1', {
        search: '  alpha  ',
        page: 1,
        limit: 1,
      });

      expect(peopleRepository.createQueryBuilder).toHaveBeenCalledWith(
        'people',
      );
      expect(qb.where).toHaveBeenCalledWith('people.tenantId != :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(people.email IS NOT NULL OR people.phone IS NOT NULL)',
      );
      expect(qb.andWhere).toHaveBeenCalledWith('people.status = :status', {
        status: PeopleStatus.ACTIVE,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(people.code ILIKE :search OR people.fullName ILIKE :search OR people.email ILIKE :search OR people.phone ILIKE :search)',
        { search: '%alpha%' },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('people.createdAt', 'DESC');
      expect(calculateSkipSpy).toHaveBeenCalledWith(1, 1);
      expect(result.total).toBe(2);
      expect(result.items).toEqual([
        {
          id: 'person-1',
          type: PeopleType.CUSTOMER,
          fullName: 'Alpha',
          email: 'alpha@example.com',
          phone: null,
          tags: ['vip'],
        },
      ]);
      expect(result.hasMore).toBe(true);
    });

    it('applies type filter when provided', async () => {
      const qb = buildQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      peopleRepository.createQueryBuilder!.mockReturnValue(qb);

      await service.searchInvitablePeople('tenant-1', {
        type: PeopleType.STAFF,
      } as InvitablePeopleQueryDto);

      expect(qb.andWhere).toHaveBeenCalledWith('people.type = :type', {
        type: PeopleType.STAFF,
      });
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
          departmentId: null,
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
        departmentId: null,
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
        relations: { user: true },
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
        departmentId: 'dept-1',
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      peopleRepository.save!.mockResolvedValue(person);

      const result = await service.update('tenant-1', 'person-2', {
        status: PeopleStatus.INACTIVE,
        tags: null,
        departmentId: 'dept-2',
      } as unknown as UpdatePeopleDto);

      expect(result.status).toBe(PeopleStatus.INACTIVE);
      expect(result.tags).toEqual([]);
      expect(result.departmentId).toBe('dept-2');
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
        departmentId: 'dept-legacy',
      } as unknown as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      peopleRepository.save!.mockResolvedValue(person);

      const result = await service.update('tenant-1', 'person-3', {
        departmentId: 'dept-sales',
      } as UpdatePeopleDto);

      expect(result.departmentId).toBeNull();
    });
  });

  describe('inviteExisting', () => {
    it('clones person into active tenant with new code', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-2',
        type: PeopleType.STAFF,
        fullName: 'Staff Member',
        email: 'staff@example.com',
        phone: '+628123',
        status: PeopleStatus.ACTIVE,
        tags: ['trainer'],
        departmentId: 'dept-ops',
        userId: 'user-1',
      } as PeopleEntity;
      const created = { id: 'new-person' } as PeopleEntity;

      peopleRepository
        .findOne!.mockResolvedValueOnce(person)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      tenantCountersService.getNextPeopleCode.mockResolvedValue('STF-000010');
      peopleRepository.create!.mockReturnValue(created);
      peopleRepository.save!.mockResolvedValue(created);

      const result = await service.inviteExisting('tenant-1', {
        personId: 'person-1',
      });

      expect(tenantCountersService.getNextPeopleCode).toHaveBeenCalledWith(
        'tenant-1',
        PeopleType.STAFF,
      );
      expect(peopleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          type: PeopleType.STAFF,
          code: 'STF-000010',
          fullName: 'Staff Member',
          email: 'staff@example.com',
          phone: '+628123',
          status: PeopleStatus.ACTIVE,
          tags: ['trainer'],
          departmentId: null, // Don't copy departmentId across tenants
          userId: null,
        }),
      );
      expect(result).toBe(created);
    });

    it('throws NotFoundException when person is missing or already in tenant', async () => {
      peopleRepository.findOne!.mockResolvedValueOnce(null);

      await expect(
        service.inviteExisting('tenant-1', { personId: 'missing' }),
      ).rejects.toThrow(NotFoundException);

      peopleRepository.findOne!.mockResolvedValueOnce({
        id: 'person-2',
        tenantId: 'tenant-1',
      } as PeopleEntity);

      await expect(
        service.inviteExisting('tenant-1', { personId: 'person-2' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException on duplicate email', async () => {
      const person = {
        id: 'person-3',
        tenantId: 'tenant-2',
        type: PeopleType.CUSTOMER,
        fullName: 'Duplicate',
        email: 'dup@example.com',
        phone: null,
        status: PeopleStatus.ACTIVE,
        tags: [],
      } as unknown as PeopleEntity;

      peopleRepository
        .findOne!.mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.inviteExisting('tenant-1', { personId: 'person-3' }),
      ).rejects.toThrow(ConflictException);
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

  describe('searchInvitableUsersForStaff', () => {
    it('excludes users already linked to staff and super admins', async () => {
      const peopleQb = buildQueryBuilder();
      peopleQb.getMany.mockResolvedValue([
        { userId: 'user-linked-1' },
        { userId: 'user-linked-2' },
      ]);
      peopleRepository.createQueryBuilder!.mockReturnValue(peopleQb);

      const usersQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'user1@test.com', fullName: 'User One' },
          { id: 'user-2', email: 'user2@test.com', fullName: null },
        ]),
      };
      usersRepository.createQueryBuilder!.mockReturnValue(usersQb);

      jest.spyOn(pagination, 'calculateSkip').mockReturnValue(0);

      const result = await service.searchInvitableUsersForStaff({
        search: 'user',
        page: 1,
        limit: 10,
      });

      expect(usersQb.where).toHaveBeenCalledWith(
        'user.isSuperAdmin = :isSuperAdmin',
        { isSuperAdmin: false },
      );
      expect(usersQb.andWhere).toHaveBeenCalledWith(
        'user.id NOT IN (:...linkedUserIds)',
        { linkedUserIds: ['user-linked-1', 'user-linked-2'] },
      );
      expect(usersQb.andWhere).toHaveBeenCalledWith(
        '(user.email ILIKE :search OR user.fullName ILIKE :search)',
        { search: '%user%' },
      );
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('returns all active non-super-admin users when no staff links exist', async () => {
      const peopleQb = buildQueryBuilder();
      peopleQb.getMany.mockResolvedValue([]);
      peopleRepository.createQueryBuilder!.mockReturnValue(peopleQb);

      const usersQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'user-3', email: 'user3@test.com', fullName: 'User Three' },
          ]),
      };
      usersRepository.createQueryBuilder!.mockReturnValue(usersQb);

      jest.spyOn(pagination, 'calculateSkip').mockReturnValue(0);

      const result = await service.searchInvitableUsersForStaff({});

      // Should not call andWhere with NOT IN when no linked users
      expect(usersQb.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('NOT IN'),
        expect.anything(),
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('linkUser', () => {
    it('throws BadRequestException for non-STAFF type', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.CUSTOMER,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);

      await expect(
        service.linkUser('tenant-1', 'person-1', { userId: 'user-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for non-existent user', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      usersRepository.findOne!.mockResolvedValueOnce(null);

      await expect(
        service.linkUser('tenant-1', 'person-1', { userId: 'user-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for super admin user', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      usersRepository.findOne!.mockResolvedValueOnce({
        id: 'super-admin',
        isSuperAdmin: true,
      });

      await expect(
        service.linkUser('tenant-1', 'person-1', { userId: 'super-admin' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user already linked to another staff', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      usersRepository.findOne!.mockResolvedValueOnce({
        id: 'user-1',
        isSuperAdmin: false,
      });
      peopleRepository.findOne!.mockResolvedValueOnce({
        id: 'person-other',
        userId: 'user-1',
        type: PeopleType.STAFF,
      });

      await expect(
        service.linkUser('tenant-1', 'person-1', { userId: 'user-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('successfully links user to staff record', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
        userId: null,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      usersRepository.findOne!.mockResolvedValueOnce({
        id: 'user-1',
        isSuperAdmin: false,
      });
      peopleRepository.findOne!.mockResolvedValueOnce(null); // No existing link
      peopleRepository.save!.mockResolvedValue({ ...person, userId: 'user-1' });
      peopleRepository.findOne!.mockResolvedValueOnce({
        ...person,
        userId: 'user-1',
      });

      await service.linkUser('tenant-1', 'person-1', {
        userId: 'user-1',
      });

      expect(person.userId).toBe('user-1');
      expect(peopleRepository.save).toHaveBeenCalledWith(person);
    });

    it('allows re-linking the same user to the same staff', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
        userId: 'user-1',
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      usersRepository.findOne!.mockResolvedValueOnce({
        id: 'user-1',
        isSuperAdmin: false,
      });
      peopleRepository.findOne!.mockResolvedValueOnce(person); // Same person
      peopleRepository.save!.mockResolvedValue(person);
      peopleRepository.findOne!.mockResolvedValueOnce(person);

      await expect(
        service.linkUser('tenant-1', 'person-1', { userId: 'user-1' }),
      ).resolves.not.toThrow();
    });
  });

  describe('unlinkUser', () => {
    it('throws BadRequestException for non-STAFF type', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.SUPPLIER,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);

      await expect(service.unlinkUser('tenant-1', 'person-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('successfully unlinks user from staff record', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
        userId: 'user-1',
      } as PeopleEntity;

      peopleRepository
        .findOne!.mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ ...person, userId: null });
      peopleRepository.update!.mockResolvedValue({} as any);

      const result = await service.unlinkUser('tenant-1', 'person-1');

      expect(peopleRepository.update).toHaveBeenCalledWith(
        { id: 'person-1', tenantId: 'tenant-1' },
        { userId: null },
      );
      expect(result.userId).toBeNull();
    });
  });

  describe('createUserForStaff', () => {
    it('throws BadRequestException for non-STAFF type', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.CUSTOMER,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);

      await expect(
        service.createUserForStaff('tenant-1', 'person-1', {
          email: 'test@example.com',
          tempPassword: 'password123',
          roleId: 'role-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when email already exists', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      usersRepository.findOne!.mockResolvedValueOnce({ id: 'existing-user' });

      await expect(
        service.createUserForStaff('tenant-1', 'person-1', {
          email: 'existing@example.com',
          tempPassword: 'password123',
          roleId: 'role-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when role not found', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
      } as PeopleEntity;

      peopleRepository.findOne!.mockResolvedValueOnce(person);
      usersRepository.findOne!.mockResolvedValueOnce(null);
      roleRepository.findOne!.mockResolvedValueOnce(null);

      await expect(
        service.createUserForStaff('tenant-1', 'person-1', {
          email: 'new@example.com',
          tempPassword: 'password123',
          roleId: 'nonexistent-role',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates user and attaches to tenant when attachToTenant is true', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
        userId: null,
      } as PeopleEntity;
      const createdUser = { id: 'new-user-id' };
      const membership = { tenantId: 'tenant-1', userId: 'new-user-id' };

      peopleRepository
        .findOne!.mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ ...person, userId: 'new-user-id' });
      usersRepository.findOne!.mockResolvedValueOnce(null);
      roleRepository.findOne!.mockResolvedValueOnce({
        id: 'role-1',
        tenantId: 'tenant-1',
      });
      usersRepository.create = jest.fn().mockReturnValue(createdUser);
      usersRepository.save = jest.fn().mockResolvedValue(createdUser);
      tenantUserRepository.create!.mockReturnValue(membership);
      tenantUserRepository.save!.mockResolvedValue(membership);
      peopleRepository.save!.mockResolvedValue({
        ...person,
        userId: 'new-user-id',
      });

      await service.createUserForStaff('tenant-1', 'person-1', {
        email: 'new@example.com',
        fullName: 'New User',
        tempPassword: 'password123',
        attachToTenant: true,
        roleId: 'role-1',
      });

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          fullName: 'New User',
          status: 'ACTIVE',
        }),
      );
      expect(tenantUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'new-user-id',
          roleId: 'role-1',
        }),
      );
      expect(tenantUserRepository.save).toHaveBeenCalled();
      expect(peopleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'new-user-id' }),
      );
    });

    it('creates user without tenant attachment when attachToTenant is false', async () => {
      const person = {
        id: 'person-1',
        tenantId: 'tenant-1',
        type: PeopleType.STAFF,
        userId: null,
      } as PeopleEntity;
      const createdUser = { id: 'new-user-id' };

      peopleRepository
        .findOne!.mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ ...person, userId: 'new-user-id' });
      usersRepository.findOne!.mockResolvedValueOnce(null);
      usersRepository.create = jest.fn().mockReturnValue(createdUser);
      usersRepository.save = jest.fn().mockResolvedValue(createdUser);
      peopleRepository.save!.mockResolvedValue({
        ...person,
        userId: 'new-user-id',
      });

      await service.createUserForStaff('tenant-1', 'person-1', {
        email: 'new@example.com',
        tempPassword: 'password123',
        attachToTenant: false,
      });

      expect(usersRepository.create).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
      expect(tenantUserRepository.save).not.toHaveBeenCalled();
      expect(peopleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'new-user-id' }),
      );
    });
  });
});
