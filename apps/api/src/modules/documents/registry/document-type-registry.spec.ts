import { DocumentModule, DOCUMENT_TYPE_KEY } from '@gym-monorepo/shared';
import { DocumentTypeRegistry } from './document-type-registry';

describe('DocumentTypeRegistry', () => {
  describe('getType', () => {
    it('should return type definition for valid key', () => {
      const type = DocumentTypeRegistry.getType(
        DOCUMENT_TYPE_KEY.SALES_INVOICE,
      );
      expect(type).toBeDefined();
      expect(type?.key).toBe(DOCUMENT_TYPE_KEY.SALES_INVOICE);
      expect(type?.module).toBe(DocumentModule.SALES);
    });

    it('should return undefined for invalid key', () => {
      const type = DocumentTypeRegistry.getType('invalid.key');
      expect(type).toBeUndefined();
    });
  });

  describe('isValidKey', () => {
    it('should return true for all defined document keys', () => {
      Object.values(DOCUMENT_TYPE_KEY).forEach((key) => {
        expect(DocumentTypeRegistry.isValidKey(key)).toBe(true);
      });
    });

    it('should return false for unknown keys', () => {
      expect(DocumentTypeRegistry.isValidKey('unknown.key')).toBe(false);
    });
  });

  describe('getApprovalStepsCount', () => {
    it('should return 1 for single-step documents', () => {
      expect(
        DocumentTypeRegistry.getApprovalStepsCount(
          DOCUMENT_TYPE_KEY.SALES_INVOICE,
        ),
      ).toBe(1);
    });

    it('should return 2 for purchasing.po (multi-step)', () => {
      expect(
        DocumentTypeRegistry.getApprovalStepsCount(
          DOCUMENT_TYPE_KEY.PURCHASING_PO,
        ),
      ).toBe(2);
    });

    it('should return 1 for unknown keys (default)', () => {
      expect(DocumentTypeRegistry.getApprovalStepsCount('unknown.key')).toBe(1);
    });
  });

  describe('getAllTypes', () => {
    it('should return all 8 document types', () => {
      const allTypes = DocumentTypeRegistry.getAllTypes();
      expect(allTypes.length).toBe(8);
    });
  });
});
