import { DocumentModule, DOCUMENT_TYPE_KEY } from '@gym-monorepo/shared';

export interface DocumentTypeDefinition {
  key: string;
  module: DocumentModule;
  name: string;
  requiresItems: boolean;
  approvalSteps: number;
  numberingSeriesKey: string;
  postingHandler: string;
}

export class DocumentTypeRegistry {
  private static readonly definitions: Record<string, DocumentTypeDefinition> =
    {
      [DOCUMENT_TYPE_KEY.SALES_ORDER]: {
        key: DOCUMENT_TYPE_KEY.SALES_ORDER,
        module: DocumentModule.SALES,
        name: 'Sales Order',
        requiresItems: true,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.SALES_ORDER,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.SALES_INVOICE]: {
        key: DOCUMENT_TYPE_KEY.SALES_INVOICE,
        module: DocumentModule.SALES,
        name: 'Sales Invoice',
        requiresItems: true,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.SALES_INVOICE,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE]: {
        key: DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE,
        module: DocumentModule.SALES,
        name: 'Sales Credit Note',
        requiresItems: true,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.PURCHASING_PO]: {
        key: DOCUMENT_TYPE_KEY.PURCHASING_PO,
        module: DocumentModule.PURCHASE,
        name: 'Purchase Order',
        requiresItems: true,
        approvalSteps: 2,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.PURCHASING_PO,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.PURCHASING_GRN]: {
        key: DOCUMENT_TYPE_KEY.PURCHASING_GRN,
        module: DocumentModule.PURCHASE,
        name: 'Goods Receipt Note',
        requiresItems: true,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.PURCHASING_GRN,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.ACCOUNTING_JOURNAL]: {
        key: DOCUMENT_TYPE_KEY.ACCOUNTING_JOURNAL,
        module: DocumentModule.ACCOUNTING,
        name: 'General Journal',
        requiresItems: false,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.ACCOUNTING_JOURNAL,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.INVENTORY_TRANSFER]: {
        key: DOCUMENT_TYPE_KEY.INVENTORY_TRANSFER,
        module: DocumentModule.INVENTORY,
        name: 'Stock Transfer',
        requiresItems: true,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.INVENTORY_TRANSFER,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.INVENTORY_ADJUSTMENT]: {
        key: DOCUMENT_TYPE_KEY.INVENTORY_ADJUSTMENT,
        module: DocumentModule.INVENTORY,
        name: 'Stock Adjustment',
        requiresItems: true,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.INVENTORY_ADJUSTMENT,
        postingHandler: 'DefaultPostingHandler',
      },
      [DOCUMENT_TYPE_KEY.INVENTORY_COUNT]: {
        key: DOCUMENT_TYPE_KEY.INVENTORY_COUNT,
        module: DocumentModule.INVENTORY,
        name: 'Cycle Count',
        requiresItems: true,
        approvalSteps: 1,
        numberingSeriesKey: DOCUMENT_TYPE_KEY.INVENTORY_COUNT,
        postingHandler: 'DefaultPostingHandler',
      },
    };

  static getType(key: string): DocumentTypeDefinition | undefined {
    return this.definitions[key];
  }

  static isValidKey(key: string): boolean {
    return key in this.definitions;
  }

  static getApprovalStepsCount(key: string): number {
    return this.definitions[key]?.approvalSteps ?? 1;
  }

  static getAllTypes(): DocumentTypeDefinition[] {
    return Object.values(this.definitions);
  }
}
