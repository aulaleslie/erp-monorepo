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
];
