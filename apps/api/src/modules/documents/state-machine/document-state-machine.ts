import { DocumentStatus } from '@gym-monorepo/shared';
import { DocumentTypeRegistry } from '../registry/document-type-registry';

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
 * Delegates to DocumentTypeRegistry.
 */
export function getApprovalStepsCount(documentKey: string): number {
  return DocumentTypeRegistry.getApprovalStepsCount(documentKey);
}
