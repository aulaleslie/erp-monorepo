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
import { MemberEntity } from './member.entity';
import { MembershipEntity } from './membership.entity';
import { MembershipHistoryEntity } from './membership-history.entity';
import { ChartOfAccountsEntity } from './chart-of-accounts.entity';
import { CostCenterEntity } from './cost-center.entity';
import { DocumentEntity } from './document.entity';
import { DocumentItemEntity } from './document-item.entity';
import { DocumentTaxLineEntity } from './document-tax-line.entity';
import { DocumentAccountLineEntity } from './document-account-line.entity';
import { DocumentApprovalEntity } from './document-approval.entity';
import { DocumentStatusHistoryEntity } from './document-status-history.entity';
import { DocumentNumberSettingEntity } from './document-number-setting.entity';
import { LedgerEntryEntity } from './ledger-entry.entity';
import { DocumentTypeRegistryEntity } from './document-type-registry.entity';
import { DocumentOutboxEntity } from './document-outbox.entity';
import { TagEntity } from './tag.entity';
import { TagLinkEntity } from './tag-link.entity';
import { SalesHeaderEntity } from './sales-header.entity';
import { DocumentRelationEntity } from './document-relation.entity';
import { SalesAttachmentEntity } from './sales-attachment.entity';
import { SalesApprovalLevelEntity } from './sales-approval-level.entity';
import { SalesApprovalLevelRoleEntity } from './sales-approval-level-role.entity';
import { SalesApprovalEntity } from './sales-approval.entity';
import { PtPackageEntity } from './pt-package.entity';
import { TrainerAvailabilityEntity } from './trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from './trainer-availability-override.entity';
import { TenantSchedulingSettingsEntity } from './tenant-scheduling-settings.entity';
import { ScheduleBookingEntity } from './schedule-booking.entity';

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
  DocumentApprovalEntity,
  DocumentStatusHistoryEntity,
  DocumentNumberSettingEntity,
  LedgerEntryEntity,
  DocumentTypeRegistryEntity,
  DocumentOutboxEntity,
  TagEntity,
  TagLinkEntity,
  SalesHeaderEntity,
  DocumentRelationEntity,
  SalesAttachmentEntity,
  SalesApprovalLevelEntity,
  SalesApprovalLevelRoleEntity,
  SalesApprovalEntity,
  MemberEntity,
  MembershipEntity,
  MembershipHistoryEntity,
  PtPackageEntity,
  TrainerAvailabilityEntity,
  TrainerAvailabilityOverrideEntity,
  TenantSchedulingSettingsEntity,
  ScheduleBookingEntity,
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
  DocumentApprovalEntity,
  DocumentStatusHistoryEntity,
  DocumentNumberSettingEntity,
  LedgerEntryEntity,
  DocumentTypeRegistryEntity,
  DocumentOutboxEntity,
  TagEntity,
  TagLinkEntity,
  SalesHeaderEntity,
  DocumentRelationEntity,
  SalesAttachmentEntity,
  SalesApprovalLevelEntity,
  SalesApprovalLevelRoleEntity,
  SalesApprovalEntity,
  MemberEntity,
  MembershipEntity,
  MembershipHistoryEntity,
  PtPackageEntity,
  TrainerAvailabilityEntity,
  TrainerAvailabilityOverrideEntity,
  TenantSchedulingSettingsEntity,
  ScheduleBookingEntity,
];
