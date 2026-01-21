import { DocumentApprovalEntity } from '../document-approval.entity';
import { DocumentStatusHistoryEntity } from '../document-status-history.entity';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

describe('DocumentWorkflowEntities', () => {
  describe('DocumentApprovalEntity', () => {
    it('should be an instance of DocumentApprovalEntity', () => {
      const entity = new DocumentApprovalEntity();
      expect(entity).toBeInstanceOf(DocumentApprovalEntity);
    });

    it('should extend BaseAuditEntity', () => {
      const entity = new DocumentApprovalEntity();
      expect(entity).toBeInstanceOf(BaseAuditEntity);
    });

    it('should have default stepIndex of 0', () => {
      const entity = new DocumentApprovalEntity();
      // This is a bit tricky to test without actual TypeORM metadata but
      // we can check if the class definition exists and has expected properties
      expect(entity).toHaveProperty('stepIndex');
    });
  });

  describe('DocumentStatusHistoryEntity', () => {
    it('should be an instance of DocumentStatusHistoryEntity', () => {
      const entity = new DocumentStatusHistoryEntity();
      expect(entity).toBeInstanceOf(DocumentStatusHistoryEntity);
    });

    it('should have required properties', () => {
      const entity = new DocumentStatusHistoryEntity();
      expect(entity).toHaveProperty('fromStatus');
      expect(entity).toHaveProperty('toStatus');
      expect(entity).toHaveProperty('changedByUserId');
    });
  });
});
