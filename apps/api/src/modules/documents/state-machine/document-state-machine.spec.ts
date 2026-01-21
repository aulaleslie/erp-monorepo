import { DocumentStatus } from '@gym-monorepo/shared';
import {
  isValidTransition,
  getApprovalStepsCount,
  VALID_TRANSITIONS,
} from './document-state-machine';

describe('DocumentStateMachine', () => {
  describe('isValidTransition', () => {
    // Valid transitions
    it.each([
      [DocumentStatus.DRAFT, DocumentStatus.SUBMITTED],
      [DocumentStatus.DRAFT, DocumentStatus.CANCELLED],
      [DocumentStatus.SUBMITTED, DocumentStatus.APPROVED],
      [DocumentStatus.SUBMITTED, DocumentStatus.REJECTED],
      [DocumentStatus.SUBMITTED, DocumentStatus.REVISION_REQUESTED],
      [DocumentStatus.SUBMITTED, DocumentStatus.CANCELLED],
      [DocumentStatus.REVISION_REQUESTED, DocumentStatus.DRAFT],
      [DocumentStatus.APPROVED, DocumentStatus.POSTED],
      [DocumentStatus.APPROVED, DocumentStatus.CANCELLED],
    ])('returns true for %s → %s', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });

    // Invalid transitions
    it.each([
      [DocumentStatus.DRAFT, DocumentStatus.APPROVED],
      [DocumentStatus.DRAFT, DocumentStatus.POSTED],
      [DocumentStatus.DRAFT, DocumentStatus.REJECTED],
      [DocumentStatus.SUBMITTED, DocumentStatus.POSTED],
      [DocumentStatus.SUBMITTED, DocumentStatus.DRAFT],
      [DocumentStatus.APPROVED, DocumentStatus.DRAFT],
      [DocumentStatus.APPROVED, DocumentStatus.SUBMITTED],
      [DocumentStatus.POSTED, DocumentStatus.CANCELLED],
      [DocumentStatus.POSTED, DocumentStatus.DRAFT],
      [DocumentStatus.REJECTED, DocumentStatus.DRAFT],
      [DocumentStatus.REJECTED, DocumentStatus.APPROVED],
      [DocumentStatus.CANCELLED, DocumentStatus.DRAFT],
      [DocumentStatus.CANCELLED, DocumentStatus.SUBMITTED],
    ])('returns false for %s → %s', (from, to) => {
      expect(isValidTransition(from, to)).toBe(false);
    });

    // Terminal states have no outgoing transitions
    it.each([
      DocumentStatus.POSTED,
      DocumentStatus.REJECTED,
      DocumentStatus.CANCELLED,
    ])('%s is terminal state with no outgoing transitions', (status) => {
      expect(VALID_TRANSITIONS[status]).toEqual([]);
    });
  });

  describe('getApprovalStepsCount', () => {
    it('returns 1 for sales.invoice', () => {
      expect(getApprovalStepsCount('sales.invoice')).toBe(1);
    });
    it('returns 2 for purchasing.po', () => {
      expect(getApprovalStepsCount('purchasing.po')).toBe(2);
    });
    it('returns 1 for unknown document type', () => {
      expect(getApprovalStepsCount('unknown.type')).toBe(1);
    });
  });
});
