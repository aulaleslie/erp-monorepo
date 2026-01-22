import {
  DOCUMENT_TYPE_KEY,
  LedgerEntryType,
  OUTBOX_EVENT_KEYS,
  OutboxEventKey,
} from '@gym-monorepo/shared';
import { BasePostingHandler } from './base-posting-handler';
import { PostingContext } from './posting-handler.interface';

export class DefaultPostingHandler extends BasePostingHandler {
  protected async executePosting(context: PostingContext): Promise<void> {
    // Basic stub: Create one debit and one credit entry
    // These codes are expected to exist based on document-engine seed
    await this.createLedgerEntry(context, {
      accountCode: '1000', // Cash
      entryType: LedgerEntryType.DEBIT,
      amount: context.document.total,
    });

    await this.createLedgerEntry(context, {
      accountCode: '4000', // Sales Revenue (stub)
      entryType: LedgerEntryType.CREDIT,
      amount: context.document.total,
    });

    // Module-specific outbox events
    let moduleEventKey: string | null = null;
    switch (context.document.documentKey) {
      case DOCUMENT_TYPE_KEY.SALES_INVOICE:
        moduleEventKey = OUTBOX_EVENT_KEYS.SALES_INVOICE_POSTED;
        break;
      case DOCUMENT_TYPE_KEY.SALES_ORDER:
        moduleEventKey = OUTBOX_EVENT_KEYS.SALES_ORDER_POSTED;
        break;
      case DOCUMENT_TYPE_KEY.PURCHASING_PO:
        moduleEventKey = OUTBOX_EVENT_KEYS.PURCHASING_PO_POSTED;
        break;
      case DOCUMENT_TYPE_KEY.PURCHASING_GRN:
        moduleEventKey = OUTBOX_EVENT_KEYS.PURCHASING_GRN_POSTED;
        break;
    }

    if (moduleEventKey) {
      await context.outboxService.createEvent(
        {
          tenantId: context.tenantId,
          documentId: context.document.id,
          eventKey: moduleEventKey as OutboxEventKey,
          userId: context.userId,
        },
        context.manager,
      );
    }
  }
}
