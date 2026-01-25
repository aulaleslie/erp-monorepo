import { ItemDurationUnit } from '@gym-monorepo/shared';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  endOfMonth,
  isLastDayOfMonth,
} from 'date-fns';

/**
 * Calculates the end date of a membership based on duration.
 *
 * Rules:
 * 1. Standard addition based on unit.
 * 2. Edge case: if start_date is the last day of its month, end_date must be the last day of the target month
 *    (applies to MONTH and YEAR units).
 *    e.g. Jan 31 + 1 Month = Feb 28/29
 *         Jan 30 + 1 Month = Feb 28/29 (standard date-fns behavior)
 *
 * @param startDate The start date of the membership
 * @param durationValue The value of the duration (e.g., 1, 3, 6)
 * @param durationUnit The unit of the duration (DAY, WEEK, MONTH, YEAR)
 * @returns The calculated end date
 */
export function calculateMembershipEndDate(
  startDate: Date | string,
  durationValue: number,
  durationUnit: ItemDurationUnit,
): Date {
  const start = new Date(startDate);
  let end: Date;

  switch (durationUnit) {
    case ItemDurationUnit.DAY:
      end = addDays(start, durationValue);
      break;
    case ItemDurationUnit.WEEK:
      end = addWeeks(start, durationValue);
      break;
    case ItemDurationUnit.MONTH: {
      // Check edge case: if start is last day of month
      const isLastDay = isLastDayOfMonth(start);
      if (isLastDay) {
        // addMonths in date-fns already handles "Jan 31 + 1 month = Feb 28",
        // but let's be explicit about the requirement "if start_date is the last day of its month, end_date is the last day of the target month".
        // Example: Apr 30 + 1 Month = May 30? Or May 31?
        // If Apr 30 is used, date-fns addMonths(Apr 30, 1) -> May 30.
        // But Apr 30 is the last day of April. So we might want May 31.
        // Let's implement this logic:
        // 1. Calculate tentative end date using addMonths
        // 2. If start was last day of month, ensure end is last day of its month.
        const tentativeEnd = addMonths(start, durationValue);
        end = endOfMonth(tentativeEnd);
      } else {
        end = addMonths(start, durationValue);
      }
      break;
    }
    case ItemDurationUnit.YEAR: {
      // Same logic for years if needed, though usually same day next year.
      // Leap year edge case: Feb 29 2024 + 1 Year = Feb 28 2025.
      // date-fns handles this.
      // But if we have the "last day to last day" rule:
      // Dec 31 2023 + 1 Year = Dec 31 2024.
      // What about "last day" logic for years? Usually implies month logic preservation if aligned.
      // Let's apply similar logic if it's strictly "last day".
      // Although for Year, addYears usually suffices.
      // Let's check Feb 29.
      const isLastDayYear = isLastDayOfMonth(start);
      if (isLastDayYear) {
        const tentativeEnd = addYears(start, durationValue);
        end = endOfMonth(tentativeEnd);
      } else {
        end = addYears(start, durationValue);
      }
      break;
    }
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unsupported duration unit: ${durationUnit}`);
  }

  return end;
}
