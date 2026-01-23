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

export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export enum SalesDocumentType {
  ORDER = 'ORDER',
  INVOICE = 'INVOICE',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

export enum SalesTaxPricingMode {
  INCLUSIVE = 'INCLUSIVE',
  EXCLUSIVE = 'EXCLUSIVE',
}

export enum DocumentRelationType {
  ORDER_TO_INVOICE = 'ORDER_TO_INVOICE',
  INVOICE_TO_CREDIT = 'INVOICE_TO_CREDIT',
}

export const DOCUMENT_TYPE_KEY = {
  SALES_ORDER: 'sales.order',
  SALES_INVOICE: 'sales.invoice',
  SALES_CREDIT_NOTE: 'sales.credit_note',
  PURCHASING_PO: 'purchasing.po',
  PURCHASING_GRN: 'purchasing.grn',
  ACCOUNTING_JOURNAL: 'accounting.journal',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_ADJUSTMENT: 'inventory.adjustment',
  INVENTORY_COUNT: 'inventory.count',
} as const;

export type DocumentTypeKey =
  (typeof DOCUMENT_TYPE_KEY)[keyof typeof DOCUMENT_TYPE_KEY];

export const OUTBOX_EVENT_KEYS = {
  DOCUMENT_SUBMITTED: 'document.submitted',
  DOCUMENT_APPROVED: 'document.approved',
  DOCUMENT_POSTED: 'document.posted',
  DOCUMENT_CANCELLED: 'document.cancelled',
  DOCUMENT_REJECTED: 'document.rejected',
  DOCUMENT_REVISION_REQUESTED: 'document.revision_requested',
  DOCUMENT_TAGS_UPDATED: 'document.tags_updated',
  // Module-specific events
  SALES_INVOICE_POSTED: 'sales.invoice.posted',
  SALES_ORDER_POSTED: 'sales.order.posted',
  PURCHASING_PO_POSTED: 'purchasing.po.posted',
  PURCHASING_GRN_POSTED: 'purchasing.grn.posted',
} as const;

export type OutboxEventKey =
  (typeof OUTBOX_EVENT_KEYS)[keyof typeof OUTBOX_EVENT_KEYS];
