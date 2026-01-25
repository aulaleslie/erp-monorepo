import { PERMISSIONS } from '@gym-monorepo/shared';
import { SeedPermission } from './types';

export const corePermissions: SeedPermission[] = [
  { code: PERMISSIONS.ROLES.READ, name: 'Read Roles', group: 'Roles' },
  { code: PERMISSIONS.ROLES.CREATE, name: 'Create Roles', group: 'Roles' },
  { code: PERMISSIONS.ROLES.UPDATE, name: 'Update Roles', group: 'Roles' },
  { code: PERMISSIONS.ROLES.DELETE, name: 'Delete Roles', group: 'Roles' },
  { code: PERMISSIONS.PEOPLE.READ, name: 'Read People', group: 'People' },
  { code: PERMISSIONS.PEOPLE.CREATE, name: 'Create People', group: 'People' },
  { code: PERMISSIONS.PEOPLE.UPDATE, name: 'Update People', group: 'People' },
  { code: PERMISSIONS.PEOPLE.DELETE, name: 'Delete People', group: 'People' },
  {
    code: PERMISSIONS.DEPARTMENTS.READ,
    name: 'Read Departments',
    group: 'Departments',
  },
  {
    code: PERMISSIONS.DEPARTMENTS.CREATE,
    name: 'Create Departments',
    group: 'Departments',
  },
  {
    code: PERMISSIONS.DEPARTMENTS.UPDATE,
    name: 'Update Departments',
    group: 'Departments',
  },
  {
    code: PERMISSIONS.DEPARTMENTS.DELETE,
    name: 'Delete Departments',
    group: 'Departments',
  },
  { code: PERMISSIONS.USERS.READ, name: 'Read Users', group: 'Users' },
  { code: PERMISSIONS.USERS.CREATE, name: 'Create Users', group: 'Users' },
  { code: PERMISSIONS.USERS.UPDATE, name: 'Update Users', group: 'Users' },
  { code: PERMISSIONS.USERS.ASSIGN_ROLE, name: 'Assign Role', group: 'Users' },
  { code: PERMISSIONS.USERS.DELETE, name: 'Delete Users', group: 'Users' },
  {
    code: PERMISSIONS.SETTINGS.TENANT.READ,
    name: 'Read Tenant Settings',
    group: 'Tenant',
  },
  {
    code: PERMISSIONS.SETTINGS.TENANT.UPDATE,
    name: 'Update Tenant Settings',
    group: 'Tenant',
  },
  {
    code: PERMISSIONS.CATEGORIES.READ,
    name: 'Read Categories',
    group: 'Catalog',
  },
  {
    code: PERMISSIONS.CATEGORIES.CREATE,
    name: 'Create Categories',
    group: 'Catalog',
  },
  {
    code: PERMISSIONS.CATEGORIES.UPDATE,
    name: 'Update Categories',
    group: 'Catalog',
  },
  {
    code: PERMISSIONS.CATEGORIES.DELETE,
    name: 'Delete Categories',
    group: 'Catalog',
  },
  { code: PERMISSIONS.ITEMS.READ, name: 'Read Items', group: 'Catalog' },
  { code: PERMISSIONS.ITEMS.CREATE, name: 'Create Items', group: 'Catalog' },
  { code: PERMISSIONS.ITEMS.UPDATE, name: 'Update Items', group: 'Catalog' },
  { code: PERMISSIONS.ITEMS.DELETE, name: 'Delete Items', group: 'Catalog' },
  // Documents
  {
    code: PERMISSIONS.DOCUMENTS.READ,
    name: 'Read Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.CREATE,
    name: 'Create Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.UPDATE,
    name: 'Update Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.DELETE,
    name: 'Delete Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.SUBMIT,
    name: 'Submit Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.APPROVE,
    name: 'Approve Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.POST,
    name: 'Post Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.CANCEL,
    name: 'Cancel Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.REJECT,
    name: 'Reject Documents',
    group: 'Documents',
  },
  {
    code: PERMISSIONS.DOCUMENTS.REVISE,
    name: 'Request Revision',
    group: 'Documents',
  },
  // Sales
  { code: PERMISSIONS.SALES.READ, name: 'Read Sales', group: 'Sales' },
  { code: PERMISSIONS.SALES.CREATE, name: 'Create Sales', group: 'Sales' },
  { code: PERMISSIONS.SALES.UPDATE, name: 'Update Sales', group: 'Sales' },
  { code: PERMISSIONS.SALES.DELETE, name: 'Delete Sales', group: 'Sales' },
  { code: PERMISSIONS.SALES.SUBMIT, name: 'Submit Sales', group: 'Sales' },
  { code: PERMISSIONS.SALES.APPROVE, name: 'Approve Sales', group: 'Sales' },
  { code: PERMISSIONS.SALES.CANCEL, name: 'Cancel Sales', group: 'Sales' },
  {
    code: PERMISSIONS.SALES.ORDERS_CONVERT,
    name: 'Convert Orders',
    group: 'Sales',
  },
  {
    code: PERMISSIONS.SALES.INVOICES_POST,
    name: 'Post Invoices',
    group: 'Sales',
  },
  // Purchasing
  {
    code: PERMISSIONS.PURCHASING.READ,
    name: 'Read Purchasing',
    group: 'Purchasing',
  },
  {
    code: PERMISSIONS.PURCHASING.CREATE,
    name: 'Create Purchasing',
    group: 'Purchasing',
  },
  {
    code: PERMISSIONS.PURCHASING.UPDATE,
    name: 'Update Purchasing',
    group: 'Purchasing',
  },
  {
    code: PERMISSIONS.PURCHASING.DELETE,
    name: 'Delete Purchasing',
    group: 'Purchasing',
  },
  // Accounting
  {
    code: PERMISSIONS.ACCOUNTING.READ,
    name: 'Read Accounting',
    group: 'Accounting',
  },
  {
    code: PERMISSIONS.ACCOUNTING.CREATE,
    name: 'Create Accounting',
    group: 'Accounting',
  },
  {
    code: PERMISSIONS.ACCOUNTING.UPDATE,
    name: 'Update Accounting',
    group: 'Accounting',
  },
  {
    code: PERMISSIONS.ACCOUNTING.DELETE,
    name: 'Delete Accounting',
    group: 'Accounting',
  },
  // Inventory
  {
    code: PERMISSIONS.INVENTORY.READ,
    name: 'Read Inventory',
    group: 'Inventory',
  },
  {
    code: PERMISSIONS.INVENTORY.CREATE,
    name: 'Create Inventory',
    group: 'Inventory',
  },
  {
    code: PERMISSIONS.INVENTORY.UPDATE,
    name: 'Update Inventory',
    group: 'Inventory',
  },
  {
    code: PERMISSIONS.INVENTORY.DELETE,
    name: 'Delete Inventory',
    group: 'Inventory',
  },
  { code: PERMISSIONS.TAGS.ASSIGN, name: 'Assign Tags', group: 'Tags' },
  { code: PERMISSIONS.TAGS.MANAGE, name: 'Manage Tags', group: 'Tags' },
  // Members
  { code: PERMISSIONS.MEMBERS.READ, name: 'Read Members', group: 'Members' },
  {
    code: PERMISSIONS.MEMBERS.CREATE,
    name: 'Create Members',
    group: 'Members',
  },
  {
    code: PERMISSIONS.MEMBERS.UPDATE,
    name: 'Update Members',
    group: 'Members',
  },
  {
    code: PERMISSIONS.MEMBERS.DELETE,
    name: 'Delete Members',
    group: 'Members',
  },
  // PT Sessions
  {
    code: PERMISSIONS.PT_SESSIONS.READ,
    name: 'Read PT Packages',
    group: 'PT Sessions',
  },
  {
    code: PERMISSIONS.PT_SESSIONS.CREATE,
    name: 'Create PT Packages',
    group: 'PT Sessions',
  },
  {
    code: PERMISSIONS.PT_SESSIONS.UPDATE,
    name: 'Update PT Packages',
    group: 'PT Sessions',
  },
  {
    code: PERMISSIONS.PT_SESSIONS.CANCEL,
    name: 'Cancel PT Packages',
    group: 'PT Sessions',
  },
];
