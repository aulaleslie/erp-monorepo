import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  GroupSessionStatus,
  ItemDurationUnit,
  ItemServiceKind,
  PeopleType,
} from '@gym-monorepo/shared';
import { GroupSessionsService } from './group-sessions.service';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { GroupSessionParticipantEntity } from '../../database/entities/group-session-participant.entity';
import { MembersService } from '../members/members.service';
import { ItemsService } from '../catalog/items/items.service';
import { PeopleService } from '../people/people.service';
import {
  MemberEntity,
  ItemEntity,
  PeopleEntity,
} from '../../database/entities';
import { DeepPartial } from 'typeorm';

describe('GroupSessionsService', () => {
  let service: GroupSessionsService;
  let groupSessionRepository: Repository<GroupSessionEntity>;
  let participantRepository: Repository<GroupSessionParticipantEntity>;
  let membersService: MembersService;
  let itemsService: ItemsService;
  let peopleService: PeopleService;

  const mockTenantId = 'tenant-uuid';
  const mockMemberId = 'member-uuid';
  const mockItemId = 'item-uuid';
  const mockInstructorId = 'staff-uuid';
  const mockSessionId = 'session-uuid';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupSessionsService,
        {
          provide: getRepositoryToken(GroupSessionEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupSessionParticipantEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: MembersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ItemsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PeopleService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GroupSessionsService>(GroupSessionsService);
    groupSessionRepository = module.get<Repository<GroupSessionEntity>>(
      getRepositoryToken(GroupSessionEntity),
    );
    participantRepository = module.get<
      Repository<GroupSessionParticipantEntity>
    >(getRepositoryToken(GroupSessionParticipantEntity));
    membersService = module.get<MembersService>(MembersService);
    itemsService = module.get<ItemsService>(ItemsService);
    peopleService = module.get<PeopleService>(PeopleService);
  });

  describe('create', () => {
    it('should create a group session', async () => {
      const dto = {
        purchaserMemberId: mockMemberId,
        itemId: mockItemId,
        startDate: '2024-01-01',
        pricePaid: 100,
        instructorId: mockInstructorId,
      };

      const mockItem = {
        id: mockItemId,
        name: 'Group PT',
        serviceKind: ItemServiceKind.PT_SESSION,
        maxParticipants: 5,
        sessionCount: 10,
        durationValue: 1,
        durationUnit: ItemDurationUnit.MONTH,
      };

      const mockInstructor = {
        id: mockInstructorId,
        type: PeopleType.STAFF,
      };

      jest
        .spyOn(membersService, 'findOne')
        .mockResolvedValue({} as unknown as MemberEntity);
      jest
        .spyOn(itemsService, 'findOne')
        .mockResolvedValue(mockItem as unknown as ItemEntity);
      jest
        .spyOn(peopleService, 'findOne')
        .mockResolvedValue(mockInstructor as unknown as PeopleEntity);
      jest
        .spyOn(groupSessionRepository, 'create')
        .mockReturnValue(dto as unknown as GroupSessionEntity);
      jest.spyOn(groupSessionRepository, 'save').mockResolvedValue({
        id: 'new-id',
        ...dto,
      } as unknown as DeepPartial<GroupSessionEntity> & GroupSessionEntity);

      const result = await service.create(mockTenantId, dto);

      expect(result).toBeDefined();
      expect(groupSessionRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if item is not PT_SESSION', async () => {
      const dto = {
        purchaserMemberId: mockMemberId,
        itemId: mockItemId,
        startDate: '2024-01-01',
        pricePaid: 100,
      };

      jest
        .spyOn(membersService, 'findOne')
        .mockResolvedValue({} as unknown as MemberEntity);
      jest.spyOn(itemsService, 'findOne').mockResolvedValue({
        serviceKind: ItemServiceKind.MEMBERSHIP,
      } as unknown as ItemEntity);

      await expect(service.create(mockTenantId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addParticipant', () => {
    it('should add a participant', async () => {
      const mockSession = {
        id: mockSessionId,
        maxParticipants: 5,
        participants: [],
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockSession as unknown as GroupSessionEntity);
      jest
        .spyOn(membersService, 'findOne')
        .mockResolvedValue({} as unknown as MemberEntity);
      jest
        .spyOn(participantRepository, 'create')
        .mockReturnValue({} as unknown as GroupSessionParticipantEntity);
      jest.spyOn(participantRepository, 'save').mockResolvedValue({
        id: 'p-id',
      } as unknown as DeepPartial<GroupSessionParticipantEntity> &
        GroupSessionParticipantEntity);

      const result = await service.addParticipant(mockTenantId, mockSessionId, {
        memberId: 'new-member',
      });

      expect(result).toBeDefined();
      expect(participantRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if session is full', async () => {
      const mockSession = {
        id: mockSessionId,
        maxParticipants: 1,
        participants: [{ memberId: 'existing', isActive: true }],
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockSession as unknown as GroupSessionEntity);

      await expect(
        service.addParticipant(mockTenantId, mockSessionId, {
          memberId: 'new-member',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should update status to CANCELLED', async () => {
      const mockSession = {
        id: mockSessionId,
        status: GroupSessionStatus.ACTIVE,
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockSession as unknown as GroupSessionEntity);
      jest
        .spyOn(groupSessionRepository, 'save')
        .mockImplementation((s) => Promise.resolve(s as GroupSessionEntity));

      const result = await service.cancel(mockTenantId, mockSessionId);

      expect(result.status).toBe(GroupSessionStatus.CANCELLED);
    });
  });
});
