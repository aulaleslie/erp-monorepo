import { Injectable } from '@nestjs/common';
import { ItemDurationUnit } from '@gym-monorepo/shared';
import { calculateMembershipEndDate } from '../memberships/utils/membership-dates.util';

@Injectable()
export class PtSessionPackagesService {
  /**
   * Calculates the expiry date of a PT session package based on start date and item duration.
   * If no duration is defined, it never expires (returns null).
   *
   * @param startDate The start date of the package
   * @param durationValue The duration value from the item
   * @param durationUnit The duration unit from the item
   * @returns Calculated expiry date or null
   */
  calculateExpiryDate(
    startDate: Date | string,
    durationValue?: number | null,
    durationUnit?: ItemDurationUnit | null,
  ): Date | null {
    if (!durationValue || !durationUnit) {
      return null;
    }

    return calculateMembershipEndDate(startDate, durationValue, durationUnit);
  }
}
