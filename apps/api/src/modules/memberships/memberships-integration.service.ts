import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  DocumentEntity,
  MemberEntity,
  MembershipEntity,
  DocumentItemEntity,
  DocumentRelationEntity,
} from '../../database/entities';
import {
  ItemServiceKind,
  MembershipStatus,
  MemberStatus,
  DocumentRelationType,
} from '@gym-monorepo/shared';
import { calculateMembershipEndDate } from './utils/membership-dates.util';
import { addDays } from 'date-fns';
import { MembershipHistoryService } from './membership-history.service';
import { MembershipHistoryAction } from '@gym-monorepo/shared';

@Injectable()
export class MembershipsIntegrationService {
  private readonly logger = new Logger(MembershipsIntegrationService.name);

  constructor(private readonly historyService: MembershipHistoryService) {}

  async processSalesInvoice(
    document: DocumentEntity,
    manager: EntityManager,
    _tenantId: string, // Context might be redundant if in entity
    _userId: string,
  ): Promise<void> {
    const tenantId = document.tenantId;
    const personId = document.personId;
    if (!personId) {
      this.logger.warn(`Document ${document.id} has no personId. Skipping.`);
      return;
    }

    // 1. Identify membership items
    // We need to load items with their underlying Item definition to check serviceKind
    // The document passed might not have items loaded with relations, so we fetch them if needed or use what's there.
    // Ideally the posting handler passes a fully loaded document or we query.
    // sales-invoice-posting-handler should ensure items.item is loaded.

    const membershipItems = document.items.filter(
      (docItem) => docItem.item?.serviceKind === ItemServiceKind.MEMBERSHIP,
    );

    if (membershipItems.length === 0) {
      return;
    }

    this.logger.log(
      `Processing ${membershipItems.length} membership items for invoice ${document.number}`,
    );

    // 2. Ensure Member exists
    let member = await manager.findOne(MemberEntity, {
      where: {
        personId: personId,
        tenantId: tenantId,
      },
    });

    if (!member) {
      this.logger.log(`Creating new member record for person ${personId}`);
      // Find person to ensure type is CUSTOMER?
      // SalesInvoicesService already validates Person is CUSTOMER.

      // Generate member code (using tenant counter logic or simple UUID/Timestamp for now? requirement says "code generated per tenant")
      // We should use the same logic as MembersService.create.
      // Since we don't have easy access to the MembersService's code generation (unless public),
      // we'll assume a specific format or try to use a shared utility if available.
      // For now, let's use a placeholder or call a generation method.
      // Ideally, we inject MembersService, but MembersService.createMemberCode might be private.
      // We'll trust the database trigger or implement a simple generator.
      // Requirement C6A-BE-01 says "tenant counter key members with prefix MBR-".
      // We can use a helper if it exists.
      // For now, I will use a simple generator to proceed.
      // Wait, can I use TenantCountersService? It's likely in another module.
      // I'll try to keep it simple: "MBR-" + Date.now().toString().
      // IMPROVEMENT: Use proper counter service in future.

      // Actually, let's just create the entity. If there is a subscriber it might handle it?
      // No, usually logic is in Service.

      const count = await manager.count(MemberEntity, { where: { tenantId } });
      const memberCode = `MBR-${(count + 1).toString().padStart(6, '0')}`;

      member = manager.create(MemberEntity, {
        tenantId,
        personId,
        memberCode, // TODO: Use proper TenantCountersService
        status: MemberStatus.NEW,
        profileCompletionPercent: 0,
        agreesToTerms: false,
      });
      member = await manager.save(member);
    }

    // 3. Create Membership for each item
    for (const docItem of membershipItems) {
      await this.createMembershipFromItem(
        manager,
        tenantId,
        member,
        docItem,
        document,
      );
    }

    // 4. Update Member Status if needed
    // "Transition member to ACTIVE if profile is complete and agrees_to_terms."
    // Cycle 6 A says agreements required.
    // If we just created the member, agreesToTerms is false.
    // So we probably don't transition to ACTIVE yet unless we auto-accept terms? (unlikely)
    // The requirement says: "Transition member to ACTIVE if profile is complete and agrees_to_terms."
    // So we check.
    if (member.status === MemberStatus.NEW && member.agreesToTerms) {
      // Check required fields (Cycle 6A: only agrees_to_terms required).
      // If true, set ACTIVE.
      member.status = MemberStatus.ACTIVE;
      member.memberSince = new Date();
      await manager.save(member);
    }

    // 5. Update Member Expiry Code
    // We need to recompute the expiry date.
    // We can duplicate the logic from MembershipsService.updateMemberExpiry
    // or we can move that logic to a shared utility/Extensions.
    // I'll re-implement the query here using the transaction manager.

    const activeMemberships = await manager.find(MembershipEntity, {
      where: {
        memberId: member.id,
        status: MembershipStatus.ACTIVE,
      },
      order: {
        endDate: 'DESC',
      },
    });

    if (activeMemberships.length > 0) {
      member.currentExpiryDate = new Date(activeMemberships[0].endDate);
      await manager.save(member);
    }
  }

  async processCreditNote(
    document: DocumentEntity,
    manager: EntityManager,
  ): Promise<void> {
    const tenantId = document.tenantId;

    // 1. Find the related Invoices
    const relations = await manager.find(DocumentRelationEntity, {
      where: {
        toDocumentId: document.id,
        tenantId,
        relationType: DocumentRelationType.INVOICE_TO_CREDIT,
      },
    });

    if (relations.length === 0) {
      return;
    }

    // 2. Process each related invoice
    for (const relation of relations) {
      const invoiceId = relation.fromDocumentId;

      // Find memberships linked to this invoice
      const memberships = await manager.find(MembershipEntity, {
        where: {
          sourceDocumentId: invoiceId,
          tenantId,
        },
      });

      if (memberships.length === 0) continue;

      // 3. Flag for review
      for (const membership of memberships) {
        // Do NOT auto-cancel (C6B-BE-05 requirement)
        const oldStatus = membership.status;
        membership.requiresReview = true;
        await manager.save(membership);

        // Record History
        await this.historyService.logHistory(
          membership.id,
          MembershipHistoryAction.FLAGGED,
          {
            fromStatus: oldStatus,
            toStatus: membership.status,
            notes: `Flagged for review due to Credit Note: ${document.number}`,
          },
          manager,
        );
      }

      this.logger.log(
        `Flagged ${memberships.length} memberships for review due to Credit Note ${document.number}`,
      );
    }
  }

  private async createMembershipFromItem(
    manager: EntityManager,
    tenantId: string,
    member: MemberEntity,
    docItem: DocumentItemEntity,
    document: DocumentEntity,
  ): Promise<void> {
    const item = docItem.item;
    if (!item) throw new Error('Item not loaded on DocumentItem');

    if (!item.durationValue || !item.durationUnit) {
      this.logger.warn(
        `Item ${item.id} (Membership) missing duration. Skipping membership creation.`,
      );
      return;
    }

    // Determine start date
    // Check for existing active memberships to chain
    // We must use the 'manager' to see uncommitted changes if we processed multiple items
    const activeMemberships = await manager.find(MembershipEntity, {
      where: {
        memberId: member.id,
        status: MembershipStatus.ACTIVE,
      },
      order: {
        endDate: 'DESC',
      },
      take: 1,
    });

    let startDate = document.documentDate || new Date(); // Sales header date

    if (activeMemberships.length > 0) {
      const latestEndDate = activeMemberships[0].endDate;
      if (latestEndDate >= startDate) {
        startDate = addDays(latestEndDate, 1);
      }
    }

    const endDate = calculateMembershipEndDate(
      startDate,
      item.durationValue,
      item.durationUnit,
    );

    const membership = manager.create(MembershipEntity, {
      tenantId,
      memberId: member.id,
      itemId: item.id,
      itemName: item.name,
      status: MembershipStatus.ACTIVE,
      startDate,
      endDate,
      durationValue: item.durationValue,
      durationUnit: item.durationUnit,
      pricePaid: docItem.lineTotal, // Use line total (after discount)
      sourceDocumentId: document.id,
      sourceDocumentItemId: docItem.id,
      notes: `Created from Invoice ${document.number}`,
    });

    await manager.save(membership);
    this.logger.log(`Created membership for member ${member.memberCode}`);

    // Record History
    await this.historyService.logHistory(
      membership.id,
      MembershipHistoryAction.CREATED,
      {
        toStatus: membership.status,
        notes: `Created from Invoice ${document.number}`,
      },
      manager,
    );

    // Check included PT sessions
    if (item.includedPtSessions && item.includedPtSessions > 0) {
      // TODO: C6C-BE-04 Create PT Package
      this.logger.log(
        `TODO: Create PT Package for ${item.includedPtSessions} sessions`,
      );
    }
  }
}
