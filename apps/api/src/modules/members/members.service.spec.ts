import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { MemberEntity } from '../../database/entities';
import { MembersService } from './members.service';
import { PeopleService } from '../people/people.service';
import { TenantCountersService } from '../tenant-counters/tenant-counters.service';
import { MemberStatus, PeopleType } from '@gym-monorepo/shared';
import { MemberQueryDto } from './dto/member-query.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('MembersService', () => {
  let service: MembersService;
  let memberRepository: MockRepository<MemberEntity>;
  let peopleService: { findOne: jest.Mock; create: jest.Mock };
  let tenantCountersService: { getNextMemberCode: jest.Mock };

  const tenantId = 'tenant-1';

  beforeEach(async () => {
    memberRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    peopleService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    tenantCountersService = {
      getNextMemberCode: jest.fn().mockResolvedValue('MBR-000001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getRepositoryToken(MemberEntity),
          useValue: memberRepository,
        },
        {
          provide: PeopleService,
          useValue: peopleService,
        },
        {
          provide: TenantCountersService,
          useValue: tenantCountersService,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  describe('findAll', () => {
    it('should return paginated members', async () => {
      const query: MemberQueryDto = { page: 1, limit: 10 };
      const result = await service.findAll(tenantId, query);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a member from existing person', async () => {
      const personId = 'person-1';
      const dto = { personId, agreedToTerms: true };

      peopleService.findOne.mockResolvedValue({
        id: personId,
        type: PeopleType.CUSTOMER,
      });
      memberRepository
        .findOne!.mockResolvedValueOnce(null) // Check if member already exists
        .mockResolvedValueOnce({ ...dto, id: 'member-1' }); // findOne after save
      memberRepository.create!.mockReturnValue({ ...dto, id: 'member-1' });
      memberRepository.save!.mockResolvedValue({ ...dto, id: 'member-1' });

      const result = await service.create(tenantId, dto);

      expect(peopleService.findOne).toHaveBeenCalledWith(tenantId, personId);
      expect(tenantCountersService.getNextMemberCode).toHaveBeenCalled();
      expect(result.id).toBe('member-1');
    });

    it('should create a person and member if personId is missing', async () => {
      const dto = {
        person: {
          fullName: 'John Doe',
          email: 'john@example.com',
        },
        agreedToTerms: true,
      };

      peopleService.create.mockResolvedValue({
        id: 'person-new',
        type: PeopleType.CUSTOMER,
      });
      memberRepository
        .findOne!.mockResolvedValueOnce(null) // Check if member already exists
        .mockResolvedValueOnce({
          ...dto,
          personId: 'person-new',
          id: 'member-1',
        }); // findOne after save
      memberRepository.create!.mockReturnValue({
        ...dto,
        personId: 'person-new',
        id: 'member-1',
      });
      memberRepository.save!.mockResolvedValue({
        ...dto,
        personId: 'person-new',
        id: 'member-1',
      });

      const result = await service.create(tenantId, dto);

      expect(peopleService.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          fullName: 'John Doe',
          email: 'john@example.com',
        }),
      );
      expect(result.id).toBe('member-1');
    });

    it('should throw ConflictException if member already exists', async () => {
      const personId = 'person-1';
      const dto = { personId, agreedToTerms: true };

      peopleService.findOne.mockResolvedValue({
        id: personId,
        type: PeopleType.CUSTOMER,
      });
      memberRepository.findOne!.mockResolvedValue({ id: 'existing-member' });

      await expect(service.create(tenantId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if person is not a customer', async () => {
      const personId = 'person-1';
      const dto = { personId, agreedToTerms: true };

      peopleService.findOne.mockResolvedValue({
        id: personId,
        type: PeopleType.STAFF,
      });

      await expect(service.create(tenantId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update member fields', async () => {
      const memberId = 'member-1';
      const dto = { notes: 'Updated notes' };
      const member = {
        id: memberId,
        tenantId,
        notes: 'Old notes',
        profileCompletionPercent: 100,
      };

      memberRepository.findOne!.mockResolvedValue(member);
      memberRepository.save!.mockResolvedValue({ ...member, ...dto });

      const result = await service.update(tenantId, memberId, dto);

      expect(result.notes).toBe('Updated notes');
    });

    it('should transition to ACTIVE if profile is complete', async () => {
      const memberId = 'member-1';
      const dto = { status: MemberStatus.ACTIVE };
      const member = {
        id: memberId,
        tenantId,
        agreesToTerms: true,
        profileCompletionPercent: 100,
      };

      memberRepository.findOne!.mockResolvedValue(member);
      memberRepository.save!.mockResolvedValue({
        ...member,
        status: MemberStatus.ACTIVE,
        memberSince: new Date(),
      });

      const result = await service.update(tenantId, memberId, dto);

      expect(result.status).toBe(MemberStatus.ACTIVE);
    });

    it('should throw BadRequestException if activating without agreeing to terms', async () => {
      const memberId = 'member-1';
      const dto = { status: MemberStatus.ACTIVE };
      const member = {
        id: memberId,
        tenantId,
        agreesToTerms: false,
        profileCompletionPercent: 0,
      };

      memberRepository.findOne!.mockResolvedValue(member);

      try {
        await service.update(tenantId, memberId, dto);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          code: string;
          details?: { missingFields: string[] };
        };
        expect(response.code).toBe('MEMBER_PROFILE_INCOMPLETE');
        expect(response.details).toBeDefined();
        expect(response.details?.missingFields).toContain('agreesToTerms');
      }
    });
  });

  describe('remove', () => {
    it('should set status to INACTIVE', async () => {
      const memberId = 'member-1';
      const member = { id: memberId, tenantId, status: MemberStatus.ACTIVE };

      memberRepository.findOne!.mockResolvedValue(member);
      memberRepository.save!.mockResolvedValue({
        ...member,
        status: MemberStatus.INACTIVE,
      });

      await service.remove(tenantId, memberId);

      expect(member.status).toBe(MemberStatus.INACTIVE);
      expect(memberRepository.save).toHaveBeenCalled();
    });
  });

  describe('computeMemberExpiry', () => {
    it('should update currentExpiryDate to null', async () => {
      const memberId = 'member-1';
      const member = {
        id: memberId,
        tenantId,
        currentExpiryDate: new Date(),
      };

      memberRepository.findOne!.mockResolvedValue(member);
      memberRepository.save!.mockResolvedValue(member);

      await service.computeMemberExpiry(tenantId, memberId);

      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { id: memberId, tenantId },
        relations: { person: true },
      });
      expect(member.currentExpiryDate).toBeNull();
      expect(memberRepository.save).toHaveBeenCalled();
    });

    it('should not save if currentExpiryDate is already null', async () => {
      const memberId = 'member-1';
      const member = {
        id: memberId,
        tenantId,
        currentExpiryDate: null,
      };

      memberRepository.findOne!.mockResolvedValue(member);

      await service.computeMemberExpiry(tenantId, memberId);

      expect(memberRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('lookup', () => {
    it('should search by memberCode exact match', async () => {
      const query = 'MBR-123';
      const mockResult = [
        { id: '1', memberCode: query, person: { fullName: 'John Doe' } },
      ];
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockResult),
      };

      memberRepository.createQueryBuilder!.mockReturnValue(mockQb as any);

      const result = await service.lookup(tenantId, query);

      expect(memberRepository.createQueryBuilder).toHaveBeenCalledWith(
        'member',
      );
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          exactMatch: query,
          partialMatch: `%${query}%`,
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('should search by fullName partial match', async () => {
      const query = 'John';
      const mockResult = [
        { id: '1', memberCode: 'MBR-001', person: { fullName: 'John Doe' } },
      ];
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockResult),
      };

      memberRepository.createQueryBuilder!.mockReturnValue(mockQb as any);

      const result = await service.lookup(tenantId, query);

      expect(result).toEqual(mockResult);
      expect(mockQb.take).toHaveBeenCalledWith(5);
    });

    it('should limit results to 5', async () => {
      const query = 'test';
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      memberRepository.createQueryBuilder!.mockReturnValue(mockQb as any);

      await service.lookup(tenantId, query);

      expect(mockQb.take).toHaveBeenCalledWith(5);
    });
  });

  describe('updateCurrentExpiryDate', () => {
    it('should update currentExpiryDate and transition to EXPIRED if date is null', async () => {
      const memberId = 'member-1';
      const member = {
        id: memberId,
        tenantId,
        status: MemberStatus.ACTIVE,
        currentExpiryDate: new Date(),
      };

      memberRepository.findOne!.mockResolvedValue(member);
      memberRepository.save!.mockResolvedValue(member);

      await service.updateCurrentExpiryDate(tenantId, memberId, null);

      expect(member.currentExpiryDate).toBeNull();
      expect(member.status).toBe(MemberStatus.EXPIRED);
      expect(memberRepository.save).toHaveBeenCalled();
    });

    it('should not transition to EXPIRED if already NOT ACTIVE', async () => {
      const memberId = 'member-1';
      const member = {
        id: memberId,
        tenantId,
        status: MemberStatus.NEW,
        currentExpiryDate: new Date(),
      };

      memberRepository.findOne!.mockResolvedValue(member);
      memberRepository.save!.mockResolvedValue(member);

      await service.updateCurrentExpiryDate(tenantId, memberId, null);

      expect(member.currentExpiryDate).toBeNull();
      expect(member.status).toBe(MemberStatus.NEW);
    });

    it('should not save if currentExpiryDate has not changed', async () => {
      const memberId = 'member-1';
      const date = new Date('2025-01-01');
      const member = {
        id: memberId,
        tenantId,
        currentExpiryDate: date,
      };

      memberRepository.findOne!.mockResolvedValue(member);

      await service.updateCurrentExpiryDate(tenantId, memberId, date);

      expect(memberRepository.save).not.toHaveBeenCalled();
    });
  });
});
