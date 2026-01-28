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
  CHART_OF_ACCOUNTS: {
    READ: 'chartOfAccounts.read',
    CREATE: 'chartOfAccounts.create',
    UPDATE: 'chartOfAccounts.update',
    DELETE: 'chartOfAccounts.delete',
  },
  COST_CENTERS: {
    READ: 'costCenters.read',
    CREATE: 'costCenters.create',
    UPDATE: 'costCenters.update',
    DELETE: 'costCenters.delete',
  },
  DOCUMENTS: {
    READ: 'documents.read',
    CREATE: 'documents.create',
    UPDATE: 'documents.update',
    DELETE: 'documents.delete',
    SUBMIT: 'documents.submit',
    APPROVE: 'documents.approve',
    POST: 'documents.post',
    CANCEL: 'documents.cancel',
    REJECT: 'documents.reject',
    REVISE: 'documents.revise',
  },
  SALES: {
    READ: 'sales.read',
    CREATE: 'sales.create',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    SUBMIT: 'sales.submit',
    APPROVE: 'sales.approve',
    CANCEL: 'sales.cancel',
    ORDERS_CONVERT: 'sales.orders.convert',
    INVOICES_POST: 'sales.invoices.post',
  },
  PURCHASING: {
    READ: 'purchasing.read',
    CREATE: 'purchasing.create',
    UPDATE: 'purchasing.update',
    DELETE: 'purchasing.delete',
  },
  ACCOUNTING: {
    READ: 'accounting.read',
    CREATE: 'accounting.create',
    UPDATE: 'accounting.update',
    DELETE: 'accounting.delete',
  },
  INVENTORY: {
    READ: 'inventory.read',
    CREATE: 'inventory.create',
    UPDATE: 'inventory.update',
    DELETE: 'inventory.delete',
  },
  TAGS: {
    ASSIGN: 'tags.assign',
    MANAGE: 'tags.manage',
  },
  MEMBERS: {
    READ: 'members.read',
    CREATE: 'members.create',
    UPDATE: 'members.update',
    DELETE: 'members.delete',
  },
  MEMBERSHIPS: {
    READ: 'memberships.read',
    CREATE: 'memberships.create',
    UPDATE: 'memberships.update',
    CANCEL: 'memberships.cancel',
  },
  PT_SESSIONS: {
    READ: 'pt_sessions.read',
    CREATE: 'pt_sessions.create',
    UPDATE: 'pt_sessions.update',
    CANCEL: 'pt_sessions.cancel',
  },
  TRAINER_AVAILABILITY: {
    READ: 'trainer_availability.read',
    UPDATE: 'trainer_availability.update',
  },
  SCHEDULES: {
    READ: 'schedules.read',
    CREATE: 'schedules.create',
    UPDATE: 'schedules.update',
    DELETE: 'schedules.delete',
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
  | typeof PERMISSIONS.SETTINGS.TENANT[keyof typeof PERMISSIONS.SETTINGS.TENANT]
  | typeof PERMISSIONS.CHART_OF_ACCOUNTS[keyof typeof PERMISSIONS.CHART_OF_ACCOUNTS]
  | typeof PERMISSIONS.COST_CENTERS[keyof typeof PERMISSIONS.COST_CENTERS]
  | typeof PERMISSIONS.DOCUMENTS[keyof typeof PERMISSIONS.DOCUMENTS]
  | typeof PERMISSIONS.SALES[keyof typeof PERMISSIONS.SALES]
  | typeof PERMISSIONS.PURCHASING[keyof typeof PERMISSIONS.PURCHASING]
  | typeof PERMISSIONS.ACCOUNTING[keyof typeof PERMISSIONS.ACCOUNTING]
  | typeof PERMISSIONS.INVENTORY[keyof typeof PERMISSIONS.INVENTORY]
  | typeof PERMISSIONS.TAGS[keyof typeof PERMISSIONS.TAGS]
  | typeof PERMISSIONS.MEMBERS[keyof typeof PERMISSIONS.MEMBERS]
  | typeof PERMISSIONS.MEMBERSHIPS[keyof typeof PERMISSIONS.MEMBERSHIPS]
  | typeof PERMISSIONS.PT_SESSIONS[keyof typeof PERMISSIONS.PT_SESSIONS]
  | typeof PERMISSIONS.TRAINER_AVAILABILITY[keyof typeof PERMISSIONS.TRAINER_AVAILABILITY]
  | typeof PERMISSIONS.SCHEDULES[keyof typeof PERMISSIONS.SCHEDULES];

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
  PERMISSIONS.CHART_OF_ACCOUNTS.READ,
  PERMISSIONS.CHART_OF_ACCOUNTS.CREATE,
  PERMISSIONS.CHART_OF_ACCOUNTS.UPDATE,
  PERMISSIONS.CHART_OF_ACCOUNTS.DELETE,
  PERMISSIONS.COST_CENTERS.READ,
  PERMISSIONS.COST_CENTERS.CREATE,
  PERMISSIONS.COST_CENTERS.UPDATE,
  PERMISSIONS.COST_CENTERS.DELETE,
  PERMISSIONS.DOCUMENTS.READ,
  PERMISSIONS.DOCUMENTS.CREATE,
  PERMISSIONS.DOCUMENTS.UPDATE,
  PERMISSIONS.DOCUMENTS.DELETE,
  PERMISSIONS.DOCUMENTS.SUBMIT,
  PERMISSIONS.DOCUMENTS.APPROVE,
  PERMISSIONS.DOCUMENTS.POST,
  PERMISSIONS.DOCUMENTS.CANCEL,
  PERMISSIONS.DOCUMENTS.REJECT,
  PERMISSIONS.DOCUMENTS.REVISE,
  PERMISSIONS.SALES.READ,
  PERMISSIONS.SALES.CREATE,
  PERMISSIONS.SALES.UPDATE,
  PERMISSIONS.SALES.DELETE,
  PERMISSIONS.SALES.SUBMIT,
  PERMISSIONS.SALES.APPROVE,
  PERMISSIONS.SALES.CANCEL,
  PERMISSIONS.SALES.ORDERS_CONVERT,
  PERMISSIONS.SALES.INVOICES_POST,
  PERMISSIONS.PURCHASING.READ,
  PERMISSIONS.PURCHASING.CREATE,
  PERMISSIONS.PURCHASING.UPDATE,
  PERMISSIONS.PURCHASING.DELETE,
  PERMISSIONS.ACCOUNTING.READ,
  PERMISSIONS.ACCOUNTING.CREATE,
  PERMISSIONS.ACCOUNTING.UPDATE,
  PERMISSIONS.ACCOUNTING.DELETE,
  PERMISSIONS.INVENTORY.READ,
  PERMISSIONS.INVENTORY.CREATE,
  PERMISSIONS.INVENTORY.UPDATE,
  PERMISSIONS.INVENTORY.DELETE,
  PERMISSIONS.TAGS.ASSIGN,
  PERMISSIONS.TAGS.MANAGE,
  PERMISSIONS.MEMBERS.READ,
  PERMISSIONS.MEMBERS.CREATE,
  PERMISSIONS.MEMBERS.UPDATE,
  PERMISSIONS.MEMBERS.DELETE,
  PERMISSIONS.MEMBERSHIPS.READ,
  PERMISSIONS.MEMBERSHIPS.CREATE,
  PERMISSIONS.MEMBERSHIPS.UPDATE,
  PERMISSIONS.MEMBERSHIPS.CANCEL,
  PERMISSIONS.PT_SESSIONS.READ,
  PERMISSIONS.PT_SESSIONS.CREATE,
  PERMISSIONS.PT_SESSIONS.UPDATE,
  PERMISSIONS.PT_SESSIONS.CANCEL,
  PERMISSIONS.TRAINER_AVAILABILITY.READ,
  PERMISSIONS.TRAINER_AVAILABILITY.UPDATE,
  PERMISSIONS.SCHEDULES.READ,
  PERMISSIONS.SCHEDULES.CREATE,
  PERMISSIONS.SCHEDULES.UPDATE,
  PERMISSIONS.SCHEDULES.DELETE,
];
