import { DocumentStatus } from '@gym-monorepo/shared';

export const VALID_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  [DocumentStatus.DRAFT]: [DocumentStatus.SUBMITTED, DocumentStatus.CANCELLED],
  [DocumentStatus.SUBMITTED]: [
    DocumentStatus.APPROVED,
    DocumentStatus.REJECTED,
    DocumentStatus.REVISION_REQUESTED,
    DocumentStatus.CANCELLED,
  ],
  [DocumentStatus.REVISION_REQUESTED]: [DocumentStatus.DRAFT],
  [DocumentStatus.REJECTED]: [], // Terminal state
  [DocumentStatus.APPROVED]: [DocumentStatus.POSTED, DocumentStatus.CANCELLED],
  [DocumentStatus.POSTED]: [], // Terminal state (reversal required)
  [DocumentStatus.CANCELLED]: [], // Terminal state
};

export function isValidTransition(
  from: DocumentStatus,
  to: DocumentStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the number of approval steps for a document type.
 * This is a stub until CA-BE-04 implements the full document type registry.
 */
export function getApprovalStepsCount(documentKey: string): number {
  // Default to 1 step for all document types
  // Will be replaced by document type registry lookup in CA-BE-04
  const APPROVAL_STEPS: Record<string, number> = {
    'sales.order': 1,
    'sales.invoice': 1,
    'purchasing.po': 2, // Example of multi-step
    'purchasing.grn': 1,
    'accounting.journal': 1,
    'inventory.transfer': 1,
    'inventory.adjustment': 1,
    'inventory.count': 1,
  };
  return APPROVAL_STEPS[documentKey] ?? 1;
}
