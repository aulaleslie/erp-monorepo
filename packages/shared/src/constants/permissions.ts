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
  PEOPLE: {
    READ: 'people.read',
    CREATE: 'people.create',
    UPDATE: 'people.update',
    DELETE: 'people.delete',
  },
  DEPARTMENTS: {
    READ: 'departments.read',
    CREATE: 'departments.create',
    UPDATE: 'departments.update',
    DELETE: 'departments.delete',
  },
  CATEGORIES: {
    READ: 'categories.read',
    CREATE: 'categories.create',
    UPDATE: 'categories.update',
    DELETE: 'categories.delete',
  },
  ITEMS: {
    READ: 'items.read',
    CREATE: 'items.create',
    UPDATE: 'items.update',
    DELETE: 'items.delete',
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
  },
} as const;

// Type-safe permission values
export type PermissionCode = 
  | typeof PERMISSIONS.ROLES[keyof typeof PERMISSIONS.ROLES]
  | typeof PERMISSIONS.PEOPLE[keyof typeof PERMISSIONS.PEOPLE]
  | typeof PERMISSIONS.DEPARTMENTS[keyof typeof PERMISSIONS.DEPARTMENTS]
  | typeof PERMISSIONS.CATEGORIES[keyof typeof PERMISSIONS.CATEGORIES]
  | typeof PERMISSIONS.ITEMS[keyof typeof PERMISSIONS.ITEMS]
  | typeof PERMISSIONS.USERS[keyof typeof PERMISSIONS.USERS]
  | typeof PERMISSIONS.SETTINGS.TENANT[keyof typeof PERMISSIONS.SETTINGS.TENANT];

// All permission codes as a flat array (useful for validation)
export const ALL_PERMISSION_CODES: PermissionCode[] = [
  PERMISSIONS.ROLES.READ,
  PERMISSIONS.ROLES.CREATE,
  PERMISSIONS.ROLES.UPDATE,
  PERMISSIONS.ROLES.DELETE,
  PERMISSIONS.PEOPLE.READ,
  PERMISSIONS.PEOPLE.CREATE,
  PERMISSIONS.PEOPLE.UPDATE,
  PERMISSIONS.PEOPLE.DELETE,
  PERMISSIONS.DEPARTMENTS.READ,
  PERMISSIONS.DEPARTMENTS.CREATE,
  PERMISSIONS.DEPARTMENTS.UPDATE,
  PERMISSIONS.DEPARTMENTS.DELETE,
  PERMISSIONS.CATEGORIES.READ,
  PERMISSIONS.CATEGORIES.CREATE,
  PERMISSIONS.CATEGORIES.UPDATE,
  PERMISSIONS.CATEGORIES.DELETE,
  PERMISSIONS.ITEMS.READ,
  PERMISSIONS.ITEMS.CREATE,
  PERMISSIONS.ITEMS.UPDATE,
  PERMISSIONS.ITEMS.DELETE,
  PERMISSIONS.USERS.READ,
  PERMISSIONS.USERS.CREATE,
  PERMISSIONS.USERS.UPDATE,
  PERMISSIONS.USERS.ASSIGN_ROLE,
  PERMISSIONS.USERS.DELETE,
  PERMISSIONS.SETTINGS.TENANT.READ,
  PERMISSIONS.SETTINGS.TENANT.UPDATE,
];
