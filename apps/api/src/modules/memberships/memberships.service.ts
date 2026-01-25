import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipEntity } from '../../database/entities/membership.entity';
import {
  ERROR_CODES,
  ItemServiceKind,
  MembershipStatus,
} from '@gym-monorepo/shared';
import { addDays } from 'date-fns';
import { calculateMembershipEndDate } from './utils/membership-dates.util';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipQueryDto } from './dto/membership-query.dto';
import {
  PaginatedResponse,
  calculateSkip,
  paginate,
} from '../../common/dto/pagination.dto';
import { ItemsService } from '../catalog/items/items.service'; // Assuming path
import { MembersService } from '../members/members.service'; // Assuming path

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(MembershipEntity)
    private readonly membershipRepo: Repository<MembershipEntity>,
    private readonly itemsService: ItemsService,
    private readonly membersService: MembersService,
  ) {}

  async findAll(
    tenantId: string,
    query: MembershipQueryDto,
  ): Promise<PaginatedResponse<MembershipEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status;
    const memberId = query.memberId;

    const qb = this.membershipRepo.createQueryBuilder('membership');
    qb.leftJoinAndSelect('membership.item', 'item');
    qb.leftJoinAndSelect('membership.member', 'member');
    qb.leftJoinAndSelect('member.person', 'person'); // If we need person name
    qb.where('membership.tenantId = :tenantId', { tenantId });

    if (memberId) {
      qb.andWhere('membership.memberId = :memberId', { memberId });
    }

    if (status) {
      qb.andWhere('membership.status = :status', { status });
    }

    qb.orderBy('membership.createdAt', 'DESC')
      .skip(calculateSkip(page, limit))
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async findOne(tenantId: string, id: string): Promise<MembershipEntity> {
    const membership = await this.membershipRepo.findOne({
      where: { id, tenantId },
      relations: ['item', 'member', 'member.person'],
    });

    if (!membership) {
      throw new NotFoundException(ERROR_CODES.MEMBERSHIP.NOT_FOUND.message);
    }

    return membership;
  }

  async create(
    tenantId: string,
    dto: CreateMembershipDto,
  ): Promise<MembershipEntity> {
    // Validate Item
    const item = await this.itemsService.findOne(tenantId, dto.itemId);
    if (item.serviceKind !== ItemServiceKind.MEMBERSHIP) {
      throw new BadRequestException('Item must be a membership service');
    }

    // Determine start date logic:
    // If extending (manual creation could also be extending), logic is:
    // If member has active membership ending in future, chain it?
    // The requirement says: "On membership create ... If extending, chain from previous membership."
    // But determineMembershipStartDate is for that.
    // However, if the user explicitly provided a startDate in DTO, should we override it?
    // "new membership start_date = previous end_date + 1 day (or use provided start_date if later)."
    const determinedStartDate = await this.determineMembershipStartDate(
      dto.memberId,
      new Date(dto.startDate),
    );

    // Compute end date
    // If item has duration
    if (!item.durationValue || !item.durationUnit) {
      throw new BadRequestException(
        'Item must have duration value and unit defined',
      );
    }

    const endDate = calculateMembershipEndDate(
      determinedStartDate,
      item.durationValue,
      item.durationUnit,
    );

    const membership = this.membershipRepo.create({
      tenantId,
      memberId: dto.memberId,
      itemId: item.id,
      itemName: item.name, // snapshot
      status: MembershipStatus.ACTIVE,
      startDate: determinedStartDate,
      endDate: endDate,
      durationValue: item.durationValue,
      durationUnit: item.durationUnit,
      pricePaid: dto.pricePaid,
      notes: dto.notes,
    });

    const saved = await this.membershipRepo.save(membership);

    // Trigger member expiry recomputation
    await this.updateMemberExpiry(tenantId, dto.memberId);

    return saved;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateMembershipDto,
  ): Promise<MembershipEntity> {
    const membership = await this.findOne(tenantId, id);

    if (dto.notes !== undefined) {
      membership.notes = dto.notes;
    }

    if (dto.startDate || dto.endDate) {
      // Manual update of dates
      if (dto.startDate) {
        membership.startDate = new Date(dto.startDate);
      }
      if (dto.endDate) {
        membership.endDate = new Date(dto.endDate);
      }
      // If start date changed, should we recompute end date?
      // Requirement: "PUT /memberships/:id (update notes, dates if not from sales)"
      // Usually if user edits start date, they might want end date to shift or stay.
      // Since endDate is optional in DTO, if they pass it, we use it. If not, and they changed StartDate, we might leave EndDate as is or recompute.
      // For now, let's assume specific updates. If they want to shift both, they send both.
    }

    const saved = await this.membershipRepo.save(membership);

    // Recompute member expiry if dates changed
    if (dto.endDate) {
      await this.updateMemberExpiry(tenantId, membership.memberId);
    }

    return saved;
  }

  async cancel(tenantId: string, id: string): Promise<MembershipEntity> {
    const membership = await this.findOne(tenantId, id);

    if (membership.status === MembershipStatus.CANCELLED) {
      return membership;
    }

    membership.status = MembershipStatus.CANCELLED;
    membership.cancelledAt = new Date();
    // membership.cancelledReason = ... // Need to accept reason in DTO?
    // Requirement: "POST /memberships/:id/cancel (sets status=CANCELLED)"

    const saved = await this.membershipRepo.save(membership);

    // Trigger member expiry recomputation
    await this.updateMemberExpiry(tenantId, membership.memberId);

    return saved;
  }

  async clearReview(
    tenantId: string,
    id: string,
    action: 'KEEP' | 'CANCEL',
    reason?: string,
  ): Promise<MembershipEntity> {
    let membership = await this.findOne(tenantId, id);

    if (action === 'CANCEL') {
      // Use existing cancel logic
      membership = await this.cancel(tenantId, id);
      if (reason) {
        membership.cancelledReason = reason;
        // Optimization: handled within this save or updated object
      }
    }

    // Always clear the flag (and save reason if updated)
    // If we cancelled, we need to make sure we update the object we have
    // cancel() returns the saved entity.

    // We need to re-fetch or trust the return? cancel() returns saved.
    // requiresReview might still be true on it (from DB).
    // So we explicitly set false.
    membership.requiresReview = false;

    // If reason provided and we cancelled, make sure it's set (if cancel didn't take reason)
    // cancel() above doesn't take reason in my implementation earlier, so I set it here.
    if (action === 'CANCEL' && reason) {
      membership.cancelledReason = reason;
    }

    return this.membershipRepo.save(membership);
  }

  /**
   * Determines the start date for a new membership.
   * If the member has an active membership ending in the future (relative to requested start date),
   * the new membership should start the day after the previous one ends.
   *
   * @param memberId The ID of the member
   * @param requestedStartDate The requested start date (or today/posting date)
   * @returns The determined start date
   */
  async determineMembershipStartDate(
    memberId: string,
    requestedStartDate: Date,
  ): Promise<Date> {
    // Find active memberships for this member
    const activeMemberships = await this.membershipRepo.find({
      where: {
        memberId,
        status: MembershipStatus.ACTIVE,
      },
      order: {
        endDate: 'DESC',
      },
      take: 1,
    });

    if (activeMemberships.length > 0) {
      const latestMembership = activeMemberships[0];
      const latestEndDate = new Date(latestMembership.endDate);

      // If the latest membership ends after or on the requested start date, chaining is required.
      // E.g. Ends Jan 31, requested Jan 20 -> New Start Feb 1.
      // E.g. Ends Jan 31, requested Feb 5 -> New Start Feb 5 (Gap allowed? Requirement implied chaining "if member has active membership ending in the future").
      // Usually extending means no gap. But if they want to start later, that's fine too.
      // Requirement: "if active membership ending in the future, new membership start_date = previous end_date + 1 day (or use provided start_date if later)."

      if (latestEndDate >= requestedStartDate) {
        return addDays(latestEndDate, 1);
      }
    }

    return requestedStartDate;
  }

  /**
   * Recomputes the member's current expiry date based on their active memberships.
   * Updates the member record via MembersService.
   */
  async updateMemberExpiry(tenantId: string, memberId: string): Promise<void> {
    // Find all active memberships
    const activeMemberships = await this.membershipRepo.find({
      where: {
        memberId,
        status: MembershipStatus.ACTIVE,
      },
      order: {
        endDate: 'DESC',
      },
    });

    let maxExpiry: Date | null = null;

    if (activeMemberships.length > 0) {
      // The first one is the latest due to sorting
      maxExpiry = new Date(activeMemberships[0].endDate);
    }

    // Call MembersService to update the member
    // I need to add updateCurrentExpiry to MembersService or use update method if exposed
    // MembersService.update exposes generic update, but I need to bypass some logic maybe?
    // Actually MembersService.computeMemberExpiry logic was "Query active memberships...".
    // I can modify MembersService.computeMemberExpiry to accept the date.
    // Or I can add a specific method in MembersService: setCurrentExpiryDate(id, date).
    // Let's assume I will add `setCurrentExpiryDate` to MembersService.
    await this.membersService.updateCurrentExpiryDate(
      tenantId,
      memberId,
      maxExpiry,
    );
  }
}
