import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  DocumentEntity,
  MemberEntity,
  PtPackageEntity,
  DocumentItemEntity,
  MembershipEntity,
  DocumentRelationEntity,
} from '../../database/entities';
import {
  ItemServiceKind,
  PtPackageStatus,
  MemberStatus,
  DocumentRelationType,
} from '@gym-monorepo/shared';
import { calculateMembershipEndDate } from '../memberships/utils/membership-dates.util';

@Injectable()
export class PtSessionPackagesIntegrationService {
  private readonly logger = new Logger(
    PtSessionPackagesIntegrationService.name,
  );

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
        `Document ${document.id} has no personId. Skipping PT package processing.`,
      );
      return;
    }

    const ptItems = document.items.filter(
      (docItem) => docItem.item?.serviceKind === ItemServiceKind.PT_SESSION,
    );

    if (ptItems.length === 0) {
      return;
    }

    this.logger.log(
      `Processing ${ptItems.length} PT items for invoice ${document.number}`,
    );

    // Ensure Member exists (similar to MembershipsIntegrationService)
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
      this.logger.log(
        `Created new member ${member.memberCode} for person ${personId}`,
      );
    }

    for (const docItem of ptItems) {
      await this.createPackageFromItem(
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

    // 1. Find the related Invoices (similar to MembershipsIntegrationService)
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

      // Find PT packages linked to this invoice
      const ptPackages = await manager.find(PtPackageEntity, {
        where: {
          sourceDocumentId: invoiceId,
          tenantId,
        },
      });

      if (ptPackages.length === 0) continue;

      // 3. Flag for review
      for (const ptPackage of ptPackages) {
        ptPackage.requiresReview = true;
        await manager.save(ptPackage);
      }

      this.logger.log(
        `Flagged ${ptPackages.length} PT packages for review due to Credit Note ${document.number}`,
      );
    }
  }

  async createIncludedPackage(
    manager: EntityManager,
    tenantId: string,
    memberId: string,
    sourceMembership: MembershipEntity,
    includedSessions: number,
    expiryDate: Date | null,
  ): Promise<PtPackageEntity> {
    this.logger.log(
      `Creating included PT package (${includedSessions} sessions) for membership ${sourceMembership.id}`,
    );

    const ptPackage = manager.create(PtPackageEntity, {
      tenantId,
      memberId,
      itemId: sourceMembership.itemId,
      itemName: `${sourceMembership.itemName} (Included PT)`,
      sourceDocumentId: sourceMembership.sourceDocumentId,
      sourceDocumentItemId: sourceMembership.sourceDocumentItemId,
      sourceMembershipId: sourceMembership.id,
      status: PtPackageStatus.ACTIVE,
      totalSessions: includedSessions,
      usedSessions: 0,
      remainingSessions: includedSessions,
      startDate: sourceMembership.startDate,
      expiryDate: expiryDate,
      pricePaid: 0, // Included in membership
      notes: `Included in membership: ${sourceMembership.itemName}`,
    });

    return manager.save(ptPackage);
  }

  private async createPackageFromItem(
    manager: EntityManager,
    tenantId: string,
    memberId: string,
    docItem: DocumentItemEntity,
    document: DocumentEntity,
  ): Promise<PtPackageEntity> {
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
    const preferredTrainerId =
      (docItem.metadata?.preferredTrainerId as string) || null;

    const ptPackage = manager.create(PtPackageEntity, {
      tenantId,
      memberId,
      itemId: item.id,
      itemName: item.name,
      sourceDocumentId: document.id,
      sourceDocumentItemId: docItem.id,
      preferredTrainerId,
      status: PtPackageStatus.ACTIVE,
      totalSessions,
      usedSessions: 0,
      remainingSessions: totalSessions,
      startDate,
      expiryDate,
      pricePaid: docItem.lineTotal,
      notes: `Created from Invoice ${document.number}`,
    });

    return manager.save(ptPackage);
  }
}
