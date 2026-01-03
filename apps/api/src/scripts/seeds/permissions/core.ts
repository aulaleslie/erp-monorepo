import { SeedPermission } from './types';

export const corePermissions: SeedPermission[] = [
  { code: 'roles.read', name: 'Read Roles', group: 'Settings' },
  { code: 'roles.create', name: 'Create Roles', group: 'Settings' },
  { code: 'roles.update', name: 'Update Roles', group: 'Settings' },
  { code: 'roles.delete', name: 'Delete Roles', group: 'Settings' },
  { code: 'users.read', name: 'Read Users', group: 'Users' },
  { code: 'users.create', name: 'Create Users', group: 'Users' },
  { code: 'users.update', name: 'Update Users', group: 'Users' },
  { code: 'users.assignRole', name: 'Assign Role', group: 'Users' },
  { code: 'users.delete', name: 'Delete Users', group: 'Users' },
  { code: 'tenants.create', name: 'Create Tenants', group: 'Platform' },
  {
    code: 'settings.tenant.read',
    name: 'Read Tenant Settings',
    group: 'Settings',
  },
  {
    code: 'settings.tenant.update',
    name: 'Update Tenant Settings',
    group: 'Settings',
  },
];
