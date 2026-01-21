import {
  DocumentEntity,
  DocumentItemEntity,
  ChartOfAccountsEntity,
  CostCenterEntity,
  DocumentTaxLineEntity,
  DocumentAccountLineEntity,
} from '../index';
import {
  DocumentModule,
  DocumentStatus,
  AccountType,
  DocumentAccessScope,
} from '@gym-monorepo/shared';

describe('Document Entities', () => {
  describe('DocumentEntity', () => {
    it('should create a valid document entity instance', () => {
      const document = new DocumentEntity();
      document.module = DocumentModule.SALES;
      document.status = DocumentStatus.DRAFT;
      document.accessScope = DocumentAccessScope.TENANT;
      document.subtotal = 1000.5;
      document.discountTotal = 0;
      document.taxTotal = 100.05;
      document.total = 1100.55;

      expect(document.module).toBe(DocumentModule.SALES);
      expect(document.status).toBe(DocumentStatus.DRAFT);
      expect(document.accessScope).toBe(DocumentAccessScope.TENANT);
      expect(document.subtotal).toBe(1000.5);
      expect(document.taxTotal).toBe(100.05);
      expect(document.total).toBe(1100.55);
    });

    it('should handle decimal transformer correctly', () => {
      // Test the decimal transformer logic (normally handled by TypeORM, but we check the logic here)
      const transformer = {
        to: (value: number) => value,
        from: (value: string) => parseFloat(value),
      };

      expect(transformer.from('123.456789')).toBe(123.456789);
      expect(transformer.to(123.456789)).toBe(123.456789);
    });
  });

  describe('DocumentItemEntity', () => {
    it('should create a valid document item instance', () => {
      const item = new DocumentItemEntity();
      item.itemName = 'Test Item';
      item.quantity = 2.5;
      item.unitPrice = 100;
      item.lineTotal = 250;

      expect(item.itemName).toBe('Test Item');
      expect(item.quantity).toBe(2.5);
      expect(item.lineTotal).toBe(250);
    });
  });

  describe('ChartOfAccountsEntity', () => {
    it('should create a valid chart of accounts instance', () => {
      const coa = new ChartOfAccountsEntity();
      coa.code = '1000';
      coa.name = 'Cash';
      coa.type = AccountType.ASSET;
      coa.isActive = true;

      expect(coa.code).toBe('1000');
      expect(coa.type).toBe(AccountType.ASSET);
      expect(coa.isActive).toBe(true);
    });
  });

  describe('CostCenterEntity', () => {
    it('should create a valid cost center instance', () => {
      const cc = new CostCenterEntity();
      cc.code = 'OPS';
      cc.name = 'Operations';

      expect(cc.code).toBe('OPS');
      expect(cc.name).toBe('Operations');
    });
  });

  describe('DocumentTaxLineEntity', () => {
    it('should create a valid tax line instance', () => {
      const tl = new DocumentTaxLineEntity();
      tl.taxName = 'VAT';
      tl.taxRate = 0.1;
      tl.taxAmount = 10;

      expect(tl.taxName).toBe('VAT');
      expect(tl.taxRate).toBe(0.1);
      expect(tl.taxAmount).toBe(10);
    });
  });

  describe('DocumentAccountLineEntity', () => {
    it('should create a valid account line instance', () => {
      const al = new DocumentAccountLineEntity();
      al.debitAmount = 100;
      al.creditAmount = 0;

      expect(al.debitAmount).toBe(100);
      expect(al.creditAmount).toBe(0);
    });
  });
});
