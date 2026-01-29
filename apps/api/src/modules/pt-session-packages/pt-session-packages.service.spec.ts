import { Test, TestingModule } from '@nestjs/testing';
import { PtSessionPackagesService } from './pt-session-packages.service';
import { ItemDurationUnit, PtPackageStatus } from '@gym-monorepo/shared';
import { format } from 'date-fns';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { MembersService } from '../members/members.service';
import { ItemsService } from '../catalog/items/items.service';
import { PeopleService } from '../people/people.service';

describe('PtSessionPackagesService', () => {
  let service: PtSessionPackagesService;

  const mockRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMembersService = {
    findOne: jest.fn(),
  };

  const mockItemsService = {
    findOne: jest.fn(),
  };

  const mockPeopleService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PtSessionPackagesService,
        {
          provide: getRepositoryToken(PtPackageEntity),
          useValue: mockRepository,
        },
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
        {
          provide: PeopleService,
          useValue: mockPeopleService,
        },
      ],
    }).compile();

    service = module.get<PtSessionPackagesService>(PtSessionPackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateExpiryDate', () => {
    it('should return null if durationValue is missing', () => {
      const start = new Date('2024-01-01');
      const expiry = service.calculateExpiryDate(
        start,
        null,
        ItemDurationUnit.MONTH,
      );
      expect(expiry).toBeNull();
    });

    it('should return null if durationUnit is missing', () => {
      const start = new Date('2024-01-01');
      const expiry = service.calculateExpiryDate(start, 1, null);
      expect(expiry).toBeNull();
    });

    it('should calculate expiry date correctly for days', () => {
      const start = new Date('2024-01-01');
      const expiry = service.calculateExpiryDate(
        start,
        30,
        ItemDurationUnit.DAY,
      );
      expect(format(expiry!, 'yyyy-MM-dd')).toBe('2024-01-31');
    });

    it('should calculate expiry date correctly for months', () => {
      const start = new Date('2024-01-01');
      const expiry = service.calculateExpiryDate(
        start,
        1,
        ItemDurationUnit.MONTH,
      );
      expect(format(expiry!, 'yyyy-MM-dd')).toBe('2024-02-01');
    });

    it('should handle month edge case (last day of month)', () => {
      const start = new Date('2024-01-31');
      const expiry = service.calculateExpiryDate(
        start,
        1,
        ItemDurationUnit.MONTH,
      );
      // Jan 31 + 1 month = Feb 29 (leap year)
      expect(format(expiry!, 'yyyy-MM-dd')).toBe('2024-02-29');
    });

    it('should handle month edge case (Apr 30)', () => {
      const start = new Date('2024-04-30');
      const expiry = service.calculateExpiryDate(
        start,
        1,
        ItemDurationUnit.MONTH,
      );
      // Apr 30 (last day) + 1 month = May 31 (last day)
      expect(format(expiry!, 'yyyy-MM-dd')).toBe('2024-05-31');
    });

    it('should handle year correctly', () => {
      const start = new Date('2024-01-01');
      const expiry = service.calculateExpiryDate(
        start,
        1,
        ItemDurationUnit.YEAR,
      );
      expect(format(expiry!, 'yyyy-MM-dd')).toBe('2025-01-01');
    });
  });
  describe('processExpiries', () => {
    it('should expire active packages that have passed their expiry date', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredPackage = {
        id: 'pkg-1',
        status: PtPackageStatus.ACTIVE,
        expiryDate: new Date('2024-01-01'),
        save: jest.fn(),
      } as any;

      mockRepository.find = jest.fn().mockResolvedValue([expiredPackage]);
      mockRepository.save = jest.fn().mockResolvedValue(expiredPackage);

      await service.processExpiries();

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: PtPackageStatus.ACTIVE,
            expiryDate: expect.anything(),
          },
        }),
      );
      expect(expiredPackage.status).toBe(PtPackageStatus.EXPIRED);
      expect(mockRepository.save).toHaveBeenCalledWith(expiredPackage);
    });

    it('should not expire packages that are not yet expired', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([]);
      await service.processExpiries();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
