/**
 * Centralized permission constants for consistent usage across the application.
 * These should match the permission codes seeded in the database.
 */

export const PERMISSIONS = {
  ROLES: {
    READ: 'roles.read',
    CREATE: 'roles.create',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
  },
  USERS: {
    READ: 'users.read',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    ASSIGN_ROLE: 'users.assignRole',
    DELETE: 'users.delete',
  },
  SETTINGS: {
    TENANT: {
      READ: 'settings.tenant.read',
      UPDATE: 'settings.tenant.update',
    },
    THEME: {
      READ: 'settings.theme.read',
      UPDATE: 'settings.theme.update',
    },
  },
} as const;

// Type-safe permission values
export type PermissionCode = 
  | typeof PERMISSIONS.ROLES[keyof typeof PERMISSIONS.ROLES]
  | typeof PERMISSIONS.USERS[keyof typeof PERMISSIONS.USERS]
  | typeof PERMISSIONS.SETTINGS.TENANT[keyof typeof PERMISSIONS.SETTINGS.TENANT]
  | typeof PERMISSIONS.SETTINGS.THEME[keyof typeof PERMISSIONS.SETTINGS.THEME];

// All permission codes as a flat array (useful for validation)
export const ALL_PERMISSION_CODES: PermissionCode[] = [
  PERMISSIONS.ROLES.READ,
  PERMISSIONS.ROLES.CREATE,
  PERMISSIONS.ROLES.UPDATE,
  PERMISSIONS.ROLES.DELETE,
  PERMISSIONS.USERS.READ,
  PERMISSIONS.USERS.CREATE,
  PERMISSIONS.USERS.UPDATE,
  PERMISSIONS.USERS.ASSIGN_ROLE,
  PERMISSIONS.USERS.DELETE,
  PERMISSIONS.SETTINGS.TENANT.READ,
  PERMISSIONS.SETTINGS.TENANT.UPDATE,
  PERMISSIONS.SETTINGS.THEME.READ,
  PERMISSIONS.SETTINGS.THEME.UPDATE,
];
