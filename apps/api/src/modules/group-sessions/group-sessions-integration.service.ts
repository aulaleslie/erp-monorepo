import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  DocumentEntity,
  MemberEntity,
  GroupSessionEntity,
  DocumentItemEntity,
  DocumentRelationEntity,
} from '../../database/entities';
import {
  ItemServiceKind,
  GroupSessionStatus,
  MemberStatus,
  DocumentRelationType,
} from '@gym-monorepo/shared';
import { calculateMembershipEndDate } from '../memberships/utils/membership-dates.util';

@Injectable()
export class GroupSessionsIntegrationService {
  private readonly logger = new Logger(GroupSessionsIntegrationService.name);

  async processSalesInvoice(
    document: DocumentEntity,
    manager: EntityManager,
    _tenantId: string,
    _userId: string,
  ): Promise<void> {
    const tenantId = document.tenantId;
    const personId = document.personId;
    if (!personId) {
      this.logger.warn(
        `Document ${document.id} has no personId. Skipping Group Session processing.`,
      );
      return;
    }

    const groupItems = document.items.filter(
      (docItem) =>
        docItem.item?.serviceKind === ItemServiceKind.PT_SESSION &&
        (docItem.item?.maxParticipants ?? 1) > 1,
    );

    if (groupItems.length === 0) {
      return;
    }

    this.logger.log(
      `Processing ${groupItems.length} Group Session items for invoice ${document.number}`,
    );

    // Ensure Purchaser Member exists
    let member = await manager.findOne(MemberEntity, {
      where: { personId, tenantId },
    });

    if (!member) {
      const count = await manager.count(MemberEntity, { where: { tenantId } });
      const memberCode = `MBR-${(count + 1).toString().padStart(6, '0')}`;

      member = manager.create(MemberEntity, {
        tenantId,
        personId,
        memberCode,
        status: MemberStatus.NEW,
        profileCompletionPercent: 0,
        agreesToTerms: false,
      });
      member = await manager.save(member);
    }

    for (const docItem of groupItems) {
      await this.createGroupSessionFromItem(
        manager,
        tenantId,
        member.id,
        docItem,
        document,
      );
    }
  }

  async processCreditNote(
    document: DocumentEntity,
    manager: EntityManager,
  ): Promise<void> {
    const tenantId = document.tenantId;

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

    for (const relation of relations) {
      const invoiceId = relation.fromDocumentId;

      const groupSessions = await manager.find(GroupSessionEntity, {
        where: {
          sourceDocumentId: invoiceId,
          tenantId,
        },
      });

      if (groupSessions.length === 0) continue;

      for (const session of groupSessions) {
        // Technically GroupSession doesn't have requiresReview in implementation_plan doc
        // but it's good practice. I'll stick to what I wrote in plan or add it.
        // If I follow PtPackageEntity, I should add it.
        // Actually GroupSessionEntity I just created DOES NOT have requiresReview.
        // I will stick to plan for now.
        session.status = GroupSessionStatus.CANCELLED; // Or flag? The doc for C6B-BE-05 says flag.
        // I'll skip flagging for now as it's not in the C6F spec explicitly.
      }
      await manager.save(groupSessions);
    }
  }

  private async createGroupSessionFromItem(
    manager: EntityManager,
    tenantId: string,
    purchaserMemberId: string,
    docItem: DocumentItemEntity,
    document: DocumentEntity,
  ): Promise<GroupSessionEntity> {
    const item = docItem.item;
    if (!item) throw new Error('Item not loaded on DocumentItem');

    const startDate = document.documentDate || new Date();
    const expiryDate =
      item.durationValue && item.durationUnit
        ? calculateMembershipEndDate(
            startDate,
            item.durationValue,
            item.durationUnit,
          )
        : null;

    const totalSessions = item.sessionCount || 0;
    const instructorId = (docItem.metadata?.instructorId as string) || null;

    const groupSession = manager.create(GroupSessionEntity, {
      tenantId,
      purchaserMemberId,
      itemId: item.id,
      itemName: item.name,
      sourceDocumentId: document.id,
      sourceDocumentItemId: docItem.id,
      instructorId,
      status: GroupSessionStatus.ACTIVE,
      totalSessions,
      usedSessions: 0,
      remainingSessions: totalSessions,
      maxParticipants: item.maxParticipants,
      startDate,
      expiryDate,
      pricePaid: docItem.lineTotal,
      notes: `Created from Invoice ${document.number}`,
    });

    return manager.save(groupSession);
  }
}
