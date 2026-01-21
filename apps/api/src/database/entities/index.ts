import { AuditLogEntity } from './audit-log.entity';
import { CategoryEntity, CategoryStatus } from './category.entity';
import { DepartmentEntity } from './department.entity';
import {
  ItemEntity,
  ItemType,
  ItemServiceKind,
  ItemDurationUnit,
  ItemStatus,
} from './item.entity';
import { PermissionEntity } from './permission.entity';
import { PeopleEntity } from './people.entity';
import { RolePermissionEntity } from './role-permission.entity';
import { RoleEntity } from './role.entity';
import { TaxEntity } from './tax.entity';
import { TenantCounterEntity } from './tenant-counter.entity';
import { TenantTaxEntity } from './tenant-tax.entity';
import { TenantThemeEntity } from './tenant-theme.entity';
import { TenantUserEntity } from './tenant-user.entity';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';
import { ChartOfAccountsEntity } from './chart-of-accounts.entity';
import { CostCenterEntity } from './cost-center.entity';
import { DocumentEntity } from './document.entity';
import { DocumentItemEntity } from './document-item.entity';
import { DocumentTaxLineEntity } from './document-tax-line.entity';
import { DocumentAccountLineEntity } from './document-account-line.entity';

export {
  AuditLogEntity,
  CategoryEntity,
  CategoryStatus,
  DepartmentEntity,
  ItemEntity,
  ItemType,
  ItemServiceKind,
  ItemDurationUnit,
  ItemStatus,
  PermissionEntity,
  PeopleEntity,
  RolePermissionEntity,
  RoleEntity,
  TaxEntity,
  TenantCounterEntity,
  TenantTaxEntity,
  TenantThemeEntity,
  TenantUserEntity,
  TenantEntity,
  UserEntity,
  ChartOfAccountsEntity,
  CostCenterEntity,
  DocumentEntity,
  DocumentItemEntity,
  DocumentTaxLineEntity,
  DocumentAccountLineEntity,
};

export const ALL_ENTITIES = [
  AuditLogEntity,
  CategoryEntity,
  DepartmentEntity,
  ItemEntity,
  PermissionEntity,
  PeopleEntity,
  RolePermissionEntity,
  RoleEntity,
  TaxEntity,
  TenantCounterEntity,
  TenantTaxEntity,
  TenantThemeEntity,
  TenantUserEntity,
  TenantEntity,
  UserEntity,
  ChartOfAccountsEntity,
  CostCenterEntity,
  DocumentEntity,
  DocumentItemEntity,
  DocumentTaxLineEntity,
  DocumentAccountLineEntity,
];
