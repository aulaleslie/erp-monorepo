import { Test, TestingModule } from '@nestjs/testing';
import { PtSessionPackagesService } from './pt-session-packages.service';
import { ItemDurationUnit } from '@gym-monorepo/shared';
import { format } from 'date-fns';

describe('PtSessionPackagesService', () => {
  let service: PtSessionPackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PtSessionPackagesService],
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
});
