export enum DocumentModule {
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  ACCOUNTING = 'ACCOUNTING',
  INVENTORY = 'INVENTORY',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum DocumentAccessScope {
  TENANT = 'TENANT',
  CREATOR = 'CREATOR',
  ROLE = 'ROLE',
  USER = 'USER',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export enum LedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export const DOCUMENT_TYPE_KEY = {
  SALES_ORDER: 'sales.order',
  SALES_INVOICE: 'sales.invoice',
  PURCHASING_PO: 'purchasing.po',
  PURCHASING_GRN: 'purchasing.grn',
  ACCOUNTING_JOURNAL: 'accounting.journal',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_ADJUSTMENT: 'inventory.adjustment',
  INVENTORY_COUNT: 'inventory.count',
} as const;

export type DocumentTypeKey =
  (typeof DOCUMENT_TYPE_KEY)[keyof typeof DOCUMENT_TYPE_KEY];
