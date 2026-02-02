import { Test, TestingModule } from '@nestjs/testing';
import { GroupSessionsController } from './group-sessions.controller';
import { GroupSessionsService } from './group-sessions.service';
import { GroupSessionStatus, PaginatedResponse } from '@gym-monorepo/shared';
import {
  GroupSessionEntity,
  GroupSessionParticipantEntity,
} from '../../database/entities';

import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';

describe('GroupSessionsController', () => {
  let controller: GroupSessionsController;
  let service: GroupSessionsService;

  const mockTenantId = 'tenant-uuid';
  const mockSessionId = 'session-uuid';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupSessionsController],
      providers: [
        {
          provide: GroupSessionsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn(),
            getParticipants: jest.fn(),
            addParticipant: jest.fn(),
            removeParticipant: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: TenantsService,
          useValue: {},
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<GroupSessionsController>(GroupSessionsController);
    service = module.get<GroupSessionsService>(GroupSessionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const query = { page: '1', limit: '10' };
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
      jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(
          mockResult as unknown as PaginatedResponse<GroupSessionEntity>,
        );

      const result = await controller.findAll(mockTenantId, query);

      expect(result).toBe(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, query);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      const mockResult = { id: mockSessionId };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockResult as unknown as GroupSessionEntity);

      const result = await controller.findOne(mockTenantId, mockSessionId);

      expect(result).toBe(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(mockTenantId, mockSessionId);
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = {
        purchaserMemberId: 'm1',
        itemId: 'i1',
        startDate: '2024-01-01',
        pricePaid: 100,
      };
      const mockResult = { id: 'new-id', ...dto };
      jest
        .spyOn(service, 'create')
        .mockResolvedValue(mockResult as unknown as GroupSessionEntity);

      const result = await controller.create(mockTenantId, dto);

      expect(result).toBe(mockResult);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, dto);
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { notes: 'updated notes' };
      const mockResult = { id: mockSessionId, ...dto };
      jest
        .spyOn(service, 'update')
        .mockResolvedValue(mockResult as unknown as GroupSessionEntity);

      const result = await controller.update(mockTenantId, mockSessionId, dto);

      expect(result).toBe(mockResult);
      expect(service.update).toHaveBeenCalledWith(
        mockTenantId,
        mockSessionId,
        dto,
      );
    });
  });

  describe('cancel', () => {
    it('should call service.cancel', async () => {
      const mockResult = {
        id: mockSessionId,
        status: GroupSessionStatus.CANCELLED,
      };
      jest
        .spyOn(service, 'cancel')
        .mockResolvedValue(mockResult as unknown as GroupSessionEntity);

      const result = await controller.cancel(mockTenantId, mockSessionId);

      expect(result).toBe(mockResult);
      expect(service.cancel).toHaveBeenCalledWith(mockTenantId, mockSessionId);
    });
  });

  describe('getParticipants', () => {
    it('should call service.getParticipants', async () => {
      const mockResult = [];
      jest
        .spyOn(service, 'getParticipants')
        .mockResolvedValue(mockResult as GroupSessionParticipantEntity[]);

      const result = await controller.getParticipants(
        mockTenantId,
        mockSessionId,
      );

      expect(result).toBe(mockResult);
      expect(service.getParticipants).toHaveBeenCalledWith(
        mockTenantId,
        mockSessionId,
      );
    });
  });

  describe('addParticipant', () => {
    it('should call service.addParticipant', async () => {
      const dto = { memberId: 'm1' };
      const mockResult = { id: 'p1' };
      jest
        .spyOn(service, 'addParticipant')
        .mockResolvedValue(
          mockResult as unknown as GroupSessionParticipantEntity,
        );

      const result = await controller.addParticipant(
        mockTenantId,
        mockSessionId,
        dto,
      );

      expect(result).toBe(mockResult);
      expect(service.addParticipant).toHaveBeenCalledWith(
        mockTenantId,
        mockSessionId,
        dto,
      );
    });
  });

  describe('removeParticipant', () => {
    it('should call service.removeParticipant', async () => {
      jest.spyOn(service, 'removeParticipant').mockResolvedValue(undefined);

      await controller.removeParticipant(mockTenantId, mockSessionId, 'm1');

      expect(service.removeParticipant).toHaveBeenCalledWith(
        mockTenantId,
        mockSessionId,
        'm1',
      );
    });
  });
});
