import { LedgerEntryType } from '@gym-monorepo/shared';
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
  }
}
