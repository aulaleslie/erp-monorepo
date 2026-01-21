import { BadRequestException } from '@nestjs/common';
import {
  DocumentStatus,
  DOCUMENT_ERRORS,
  LedgerEntryType,
} from '@gym-monorepo/shared';
import {
  ChartOfAccountsEntity,
  DocumentStatusHistoryEntity,
  LedgerEntryEntity,
} from '../../../database/entities';
import { PostingContext, PostingHandler } from './posting-handler.interface';

export abstract class BasePostingHandler implements PostingHandler {
  async post(context: PostingContext): Promise<void> {
    this.checkIdempotency(context);
    this.validateState(context);

    const fromStatus = context.document.status;

    // Execute specific posting logic (implemented by subclasses)
    await this.executePosting(context);

    // Common post-posting operations
    context.document.status = DocumentStatus.POSTED;
    context.document.postedAt = new Date();
    context.document.postingDate = context.document.postingDate || new Date();
    await context.manager.save(context.document);

    await this.recordStatusHistory(
      context,
      fromStatus,
      DocumentStatus.POSTED,
      'Document posted successfully',
    );
  }

  protected abstract executePosting(context: PostingContext): Promise<void>;

  protected checkIdempotency(context: PostingContext): void {
    if (context.document.status === DocumentStatus.POSTED) {
      throw new BadRequestException(
        DOCUMENT_ERRORS.POSTING_ALREADY_PROCESSED.message,
      );
    }
  }

  protected validateState(context: PostingContext): void {
    if (context.document.status !== DocumentStatus.APPROVED) {
      throw new BadRequestException(DOCUMENT_ERRORS.INVALID_TRANSITION.message);
    }
  }

  protected async createLedgerEntry(
    context: PostingContext,
    params: {
      accountCode: string;
      entryType: LedgerEntryType;
      amount: number;
    },
  ): Promise<void> {
    // Attempt to find the account by code for the tenant
    const account = await context.manager.findOne(ChartOfAccountsEntity, {
      where: {
        tenantId: context.tenantId,
        code: params.accountCode,
      },
    });

    if (!account) {
      // For stub purposes, if we can't find it, we'll try to find any first account
      const fallbackAccount = await context.manager.findOne(
        ChartOfAccountsEntity,
        {
          where: { tenantId: context.tenantId },
        },
      );

      if (!fallbackAccount) {
        throw new BadRequestException('No Chart of Accounts found for tenant');
      }

      await this.saveLedgerEntry(context, fallbackAccount, params);
    } else {
      await this.saveLedgerEntry(context, account, params);
    }
  }

  private async saveLedgerEntry(
    context: PostingContext,
    account: ChartOfAccountsEntity,
    params: {
      accountCode: string;
      entryType: LedgerEntryType;
      amount: number;
    },
  ): Promise<void> {
    const entry = context.manager.create(LedgerEntryEntity, {
      tenantId: context.tenantId,
      documentId: context.document.id,
      entryType: params.entryType,
      accountId: account.id,
      accountCode: account.code,
      amount: params.amount,
      currencyCode: context.document.currencyCode || 'IDR',
      postedAt: new Date(),
    });

    await context.manager.save(entry);
  }

  protected async recordStatusHistory(
    context: PostingContext,
    fromStatus: DocumentStatus,
    toStatus: DocumentStatus,
    reason: string | null = null,
  ): Promise<void> {
    const history = context.manager.create(DocumentStatusHistoryEntity, {
      documentId: context.document.id,
      fromStatus,
      toStatus,
      changedByUserId: context.userId,
      reason,
      changedAt: new Date(),
    });
    await context.manager.save(history);
  }
}
