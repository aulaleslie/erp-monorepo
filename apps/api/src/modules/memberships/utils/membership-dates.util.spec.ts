import { calculateMembershipEndDate } from './membership-dates.util';
import { ItemDurationUnit } from '@gym-monorepo/shared';
import { format } from 'date-fns';

describe('Membership Date Utils', () => {
  describe('calculateMembershipEndDate', () => {
    it('should add days correctly', () => {
      const start = new Date('2024-01-01');
      const end = calculateMembershipEndDate(start, 5, ItemDurationUnit.DAY);
      expect(format(end, 'yyyy-MM-dd')).toBe('2024-01-06');
    });

    it('should add weeks correctly', () => {
      const start = new Date('2024-01-01');
      const end = calculateMembershipEndDate(start, 2, ItemDurationUnit.WEEK);
      expect(format(end, 'yyyy-MM-dd')).toBe('2024-01-15');
    });

    it('should add months correctly (standard)', () => {
      const start = new Date('2024-01-01');
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.MONTH);
      expect(format(end, 'yyyy-MM-dd')).toBe('2024-02-01');
    });

    it('should handle month edge case: Jan 31 + 1 month = Feb 29 (2024 is leap)', () => {
      const start = new Date('2024-01-31');
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.MONTH);
      // Last day of Jan -> Last day of Feb
      expect(format(end, 'yyyy-MM-dd')).toBe('2024-02-29');
    });

    it('should handle month edge case: Jan 31 + 1 month = Feb 28 (2025 non-leap)', () => {
      const start = new Date('2025-01-31');
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.MONTH);
      expect(format(end, 'yyyy-MM-dd')).toBe('2025-02-28');
    });

    it('should handle month edge case: Apr 30 + 1 month = May 31 (Start is last day)', () => {
      const start = new Date('2024-04-30'); // Last day of April
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.MONTH);
      // Requirement: if start is last day of month, end is last day of target month (May 31)
      // date-fns addMonths(Apr 30) -> May 30
      // Our logic should force May 31
      expect(format(end, 'yyyy-MM-dd')).toBe('2024-05-31');
    });

    it('should handle month edge case: Apr 15 + 1 month = May 15 (Start is NOT last day)', () => {
      const start = new Date('2024-04-15');
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.MONTH);
      expect(format(end, 'yyyy-MM-dd')).toBe('2024-05-15');
    });

    it('should add years correctly', () => {
      const start = new Date('2024-01-01');
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.YEAR);
      expect(format(end, 'yyyy-MM-dd')).toBe('2025-01-01');
    });

    it('should handle leap year correctly: Feb 29 2024 + 1 Year = Feb 28 2025', () => {
      const start = new Date('2024-02-29');
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.YEAR);
      expect(format(end, 'yyyy-MM-dd')).toBe('2025-02-28');
    });

    it('should handle last day year case: Dec 31 2023 + 1 Year = Dec 31 2024', () => {
      const start = new Date('2023-12-31');
      const end = calculateMembershipEndDate(start, 1, ItemDurationUnit.YEAR);
      expect(format(end, 'yyyy-MM-dd')).toBe('2024-12-31');
    });
  });
});
