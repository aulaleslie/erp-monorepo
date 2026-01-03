import { SeedPermission } from './types';

export const corePermissions: SeedPermission[] = [
  { code: 'roles.read', name: 'Read Roles', group: 'Roles' },
  { code: 'roles.create', name: 'Create Roles', group: 'Roles' },
  { code: 'roles.update', name: 'Update Roles', group: 'Roles' },
  { code: 'roles.delete', name: 'Delete Roles', group: 'Roles' },
  { code: 'users.read', name: 'Read Users', group: 'Users' },
  { code: 'users.create', name: 'Create Users', group: 'Users' },
  { code: 'users.update', name: 'Update Users', group: 'Users' },
  { code: 'users.assignRole', name: 'Assign Role', group: 'Users' },
  { code: 'users.delete', name: 'Delete Users', group: 'Users' },
  {
    code: 'settings.tenant.read',
    name: 'Read Tenant Settings',
    group: 'Tenant',
  },
  {
    code: 'settings.tenant.update',
    name: 'Update Tenant Settings',
    group: 'Tenant',
  },
  {
    code: 'settings.theme.read',
    name: 'Read Theme Settings',
    group: 'Theme',
  },
  {
    code: 'settings.theme.update',
    name: 'Update Theme Settings',
    group: 'Theme',
  },
];
