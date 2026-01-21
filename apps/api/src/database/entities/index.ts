/**
 * Barrel export for all database entities
 */

export { AuditLogEntity } from './audit-log.entity';
export { CategoryEntity, CategoryStatus } from './category.entity';
export { DepartmentEntity } from './department.entity';
export {
  ItemEntity,
  ItemType,
  ItemServiceKind,
  ItemDurationUnit,
  ItemStatus,
} from './item.entity';
export { PermissionEntity } from './permission.entity';
export { PeopleEntity } from './people.entity';
export { RolePermissionEntity } from './role-permission.entity';
export { RoleEntity } from './role.entity';
export { TaxEntity } from './tax.entity';
export { TenantCounterEntity } from './tenant-counter.entity';
export { TenantTaxEntity } from './tenant-tax.entity';
export { TenantThemeEntity } from './tenant-theme.entity';
export { TenantUserEntity } from './tenant-user.entity';
export { TenantEntity } from './tenant.entity';
export { UserEntity } from './user.entity';

/**
 * Array of all entities for TypeORM configuration
 */
export const ALL_ENTITIES = [
  // Note: Import dynamically to avoid circular dependency issues
  // This is used in database.module.ts and typeorm-datasource.ts
];
