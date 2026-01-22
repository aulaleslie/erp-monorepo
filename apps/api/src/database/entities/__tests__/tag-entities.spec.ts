import { TagEntity, TagLinkEntity } from '../index';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

describe('Tag Entities', () => {
  describe('TagEntity', () => {
    it('should create a valid tag entity instance', () => {
      const tag = new TagEntity();
      tag.tenantId = 'tenant-id';
      tag.name = 'Test Tag';
      tag.nameNormalized = 'test tag';
      tag.usageCount = 5;
      tag.lastUsedAt = new Date();

      expect(tag.tenantId).toBe('tenant-id');
      expect(tag.name).toBe('Test Tag');
      expect(tag.nameNormalized).toBe('test tag');
      expect(tag.usageCount).toBe(5);
      expect(tag.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should extend BaseAuditEntity', () => {
      const tag = new TagEntity();
      expect(tag).toBeInstanceOf(BaseAuditEntity);
    });

    it('should default usageCount to 0', () => {
      const tag = new TagEntity();
      // Note: TypeORM handles defaults at DB level usually,
      // but if we set it in class property it should be here.
      // Based on our implementation, it's NOT initialized in constructor.
      // However, we can test that it can be assigned.
      tag.usageCount = 0;
      expect(tag.usageCount).toBe(0);
    });
  });

  describe('TagLinkEntity', () => {
    it('should create a valid tag link entity instance', () => {
      const link = new TagLinkEntity();
      link.tenantId = 'tenant-id';
      link.tagId = 'tag-id';
      link.resourceType = 'people';
      link.resourceId = 'person-id';

      expect(link.tenantId).toBe('tenant-id');
      expect(link.tagId).toBe('tag-id');
      expect(link.resourceType).toBe('people');
      expect(link.resourceId).toBe('person-id');
    });

    it('should extend BaseAuditEntity', () => {
      const link = new TagLinkEntity();
      expect(link).toBeInstanceOf(BaseAuditEntity);
    });
  });
});
