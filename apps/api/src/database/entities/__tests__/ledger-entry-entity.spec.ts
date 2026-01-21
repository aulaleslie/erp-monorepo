import { LedgerEntryEntity } from '../ledger-entry.entity';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

describe('LedgerEntryEntity', () => {
  it('should be an instance of LedgerEntryEntity', () => {
    const entity = new LedgerEntryEntity();
    expect(entity).toBeInstanceOf(LedgerEntryEntity);
  });

  it('should extend BaseAuditEntity', () => {
    const entity = new LedgerEntryEntity();
    expect(entity).toBeInstanceOf(BaseAuditEntity);
  });

  it('should have required properties', () => {
    const entity = new LedgerEntryEntity();
    expect(entity).toHaveProperty('entryType');
    expect(entity).toHaveProperty('amount');
    expect(entity).toHaveProperty('accountId');
    expect(entity).toHaveProperty('accountCode');
  });
});
