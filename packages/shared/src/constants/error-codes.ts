/**
 * Centralized error codes for consistent error handling across the application.
 * Use these codes in API responses for frontend error handling and i18n support.
 */

// ============================================================================
// Error Code Interface
// ============================================================================

export interface ErrorCode {
  code: string;
  message: string;
}

// ============================================================================
// Authentication & Authorization Errors
// ============================================================================

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid credentials',
  },
  USER_NOT_FOUND: {
    code: 'AUTH_USER_NOT_FOUND',
    message: 'User not found',
  },
  UNAUTHORIZED: {
    code: 'AUTH_UNAUTHORIZED',
    message: 'Unauthorized',
  },
  FORBIDDEN: {
    code: 'AUTH_FORBIDDEN',
    message: 'Access denied',
  },
  SUPER_ADMIN_ONLY: {
    code: 'AUTH_SUPER_ADMIN_ONLY',
    message: 'Only Super Admins can access this resource',
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions',
  },
} as const;

// ============================================================================
// Tenant Errors
// ============================================================================

export const TENANT_ERRORS = {
  NOT_FOUND: {
    code: 'TENANT_NOT_FOUND',
    message: 'Tenant not found',
  },
  ACTIVE_TENANT_REQUIRED: {
    code: 'TENANT_ACTIVE_REQUIRED',
    message: 'Active tenant is required',
  },
  NO_ACCESS: {
    code: 'TENANT_NO_ACCESS',
    message: 'You do not have access to this tenant',
  },
  NOT_ACTIVE: {
    code: 'TENANT_NOT_ACTIVE',
    message: 'Tenant is not active',
  },
  NOT_TAXABLE: {
    code: 'TENANT_NOT_TAXABLE',
    message: 'Tenant is not taxable',
  },
  SLUG_EXISTS: {
    code: 'TENANT_SLUG_EXISTS',
    message: 'Tenant with this slug already exists',
  },
} as const;

// ============================================================================
// User Errors
// ============================================================================

export const USER_ERRORS = {
  NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  },
  EMAIL_EXISTS: {
    code: 'USER_EMAIL_EXISTS',
    message: 'User with this email already exists',
  },
  EMAIL_IN_USE: {
    code: 'USER_EMAIL_IN_USE',
    message: 'Email is already in use',
  },
  INCORRECT_PASSWORD: {
    code: 'USER_INCORRECT_PASSWORD',
    message: 'Current password is incorrect',
  },
  NOT_TENANT_MEMBER: {
    code: 'USER_NOT_TENANT_MEMBER',
    message: 'User is not a member of this tenant',
  },
  ALREADY_TENANT_MEMBER: {
    code: 'USER_ALREADY_TENANT_MEMBER',
    message: 'User is already a member of this tenant',
  },
  CANNOT_INVITE_SUPER_ADMIN: {
    code: 'USER_CANNOT_INVITE_SUPER_ADMIN',
    message: 'Cannot invite super admin users',
  },
  USE_INVITE_FOR_EXISTING: {
    code: 'USER_USE_INVITE_FOR_EXISTING',
    message: 'User with this email already exists. Use invite to add existing users.',
  },
} as const;

// ============================================================================
// Role Errors
// ============================================================================

export const ROLE_ERRORS = {
  NOT_FOUND: {
    code: 'ROLE_NOT_FOUND',
    message: 'Role not found',
  },
  NOT_FOUND_IN_TENANT: {
    code: 'ROLE_NOT_FOUND_IN_TENANT',
    message: 'Role not found in this tenant',
  },
  NAME_EXISTS: {
    code: 'ROLE_NAME_EXISTS',
    message: 'Role with this name already exists',
  },
  CANNOT_DELETE_SUPER_ADMIN: {
    code: 'ROLE_CANNOT_DELETE_SUPER_ADMIN',
    message: 'Cannot delete Super Admin role',
  },
  SUPER_ADMIN_ASSIGNMENT_FORBIDDEN: {
    code: 'ROLE_SUPER_ADMIN_ASSIGNMENT_FORBIDDEN',
    message: 'Only Super Admins can assign Super Admin roles',
  },
  SUPER_ADMIN_CREATE_FORBIDDEN: {
    code: 'ROLE_SUPER_ADMIN_CREATE_FORBIDDEN',
    message: 'Only Super Admins can create Super Admin roles',
  },
  INVALID_PERMISSIONS: {
    code: 'ROLE_INVALID_PERMISSIONS',
    message: 'Invalid permission codes provided',
  },
} as const;

// ============================================================================
// Tax Errors
// ============================================================================

export const TAX_ERRORS = {
  NOT_FOUND: {
    code: 'TAX_NOT_FOUND',
    message: 'Tax not found',
  },
  CODE_EXISTS: {
    code: 'TAX_CODE_EXISTS',
    message: 'Tax with this code already exists',
  },
  RATE_REQUIRED: {
    code: 'TAX_RATE_REQUIRED',
    message: 'Rate is required for PERCENTAGE tax type',
  },
  AMOUNT_REQUIRED: {
    code: 'TAX_AMOUNT_REQUIRED',
    message: 'Amount is required for FIXED tax type',
  },
  IN_USE_BY_TENANTS: {
    code: 'TAX_IN_USE_BY_TENANTS',
    message: 'Tax is selected by one or more tenants and cannot be modified.',
  },
  INVALID_SELECTION: {
    code: 'TAX_INVALID_SELECTION',
    message: 'One or more selected taxes are invalid or inactive',
  },
  DEFAULT_NOT_IN_SELECTION: {
    code: 'TAX_DEFAULT_NOT_IN_SELECTION',
    message: 'Default tax must be included in selected taxes',
  },
} as const;

// ============================================================================
// People Errors
// ============================================================================

export const PEOPLE_ERRORS = {
  DUPLICATE_EMAIL: {
    code: 'PEOPLE_DUPLICATE_EMAIL',
    message: 'Email is already in use for this tenant',
  },
  DUPLICATE_PHONE: {
    code: 'PEOPLE_DUPLICATE_PHONE',
    message: 'Phone is already in use for this tenant',
  },
  INVALID_PHONE: {
    code: 'PEOPLE_INVALID_PHONE',
    message: 'Invalid phone number format',
  },
  NOT_FOUND: {
    code: 'PEOPLE_NOT_FOUND',
    message: 'Person not found',
  },
  NOT_STAFF_RECORD: {
    code: 'PEOPLE_NOT_STAFF_RECORD',
    message: 'Person must be type STAFF to link/unlink user',
  },
  USER_ALREADY_LINKED: {
    code: 'PEOPLE_USER_ALREADY_LINKED',
    message: 'User is already linked to a staff record',
  },
} as const;

// ============================================================================
// Department Errors
// ============================================================================

export const DEPARTMENT_ERRORS = {
  NOT_FOUND: {
    code: 'DEPARTMENT_NOT_FOUND',
    message: 'Department not found',
  },
  DUPLICATE_NAME: {
    code: 'DEPARTMENT_DUPLICATE_NAME',
    message: 'Department with this name already exists',
  },
} as const;

// ============================================================================
// Item Errors
// ============================================================================

export const ITEM_ERRORS = {
  NOT_FOUND: {
    code: 'ITEM_NOT_FOUND',
    message: 'Item not found',
  },
  DUPLICATE_BARCODE: {
    code: 'ITEM_DUPLICATE_BARCODE',
    message: 'Barcode is already in use for this tenant',
  },
  INVALID_SERVICE_FIELDS: {
    code: 'ITEM_INVALID_SERVICE_FIELDS',
    message: 'Invalid service fields for this item type',
  },
  DUPLICATE_NAME: {
    code: 'ITEM_DUPLICATE_NAME',
    message: 'Item with this name, type, and category already exists',
  },
} as const;

// ============================================================================
// Category Errors
// ============================================================================

export const CATEGORY_ERRORS = {
  NOT_FOUND: {
    code: 'CATEGORY_NOT_FOUND',
    message: 'Category not found',
  },
  DUPLICATE_NAME: {
    code: 'CATEGORY_DUPLICATE_NAME',
    message: 'Category with this name already exists',
  },
  MAX_DEPTH: {
    code: 'CATEGORY_MAX_DEPTH',
    message: 'Category tree cannot exceed 2 levels',
  },
} as const;

// ============================================================================
// Import Errors
// ============================================================================

export const IMPORT_ERRORS = {
  INVALID_FILE_FORMAT: {
    code: 'IMPORT_INVALID_FILE_FORMAT',
    message: 'Invalid file format. Expected CSV or XLSX.',
  },
  MISSING_REQUIRED_COLUMN: {
    code: 'IMPORT_MISSING_REQUIRED_COLUMN',
    message: 'Missing required column',
  },
  INVALID_ROW_DATA: {
    code: 'IMPORT_INVALID_ROW_DATA',
    message: 'Invalid data in row',
  },
  IMAGE_DOWNLOAD_FAILED: {
    code: 'IMPORT_IMAGE_DOWNLOAD_FAILED',
    message: 'Failed to download image from URL',
  },
  IMAGE_TOO_LARGE: {
    code: 'IMPORT_IMAGE_TOO_LARGE',
    message: 'Downloaded image exceeds 1MB limit',
  },
  IMAGE_INVALID_TYPE: {
    code: 'IMPORT_IMAGE_INVALID_TYPE',
    message: 'Downloaded image has invalid type',
  },
} as const;

// ============================================================================
// Storage Errors
// ============================================================================

export const STORAGE_ERRORS = {
  NOT_CONFIGURED: {
    code: 'STORAGE_NOT_CONFIGURED',
    message: 'Storage service is not configured',
  },
  INVALID_FILE_TYPE: {
    code: 'STORAGE_INVALID_FILE_TYPE',
    message: 'Invalid file type',
  },
  FILE_TOO_LARGE: {
    code: 'STORAGE_FILE_TOO_LARGE',
    message: 'File size exceeds the maximum allowed size',
  },
} as const;

// ============================================================================
// Theme Errors
// ============================================================================

export const THEME_ERRORS = {
  NOT_FOUND: {
    code: 'THEME_NOT_FOUND',
    message: 'Theme not found',
  },
  INVALID_PRESET: {
    code: 'THEME_INVALID_PRESET',
    message: 'Invalid theme preset',
  },
  ALREADY_EXISTS: {
    code: 'THEME_ALREADY_EXISTS',
    message: 'Theme already exists for this tenant',
  },
} as const;

// ============================================================================
// Document Errors
// ============================================================================

export const DOCUMENT_ERRORS = {
  NOT_FOUND: {
    code: 'DOCUMENT_NOT_FOUND',
    message: 'Document not found',
  },
  INVALID_TRANSITION: {
    code: 'DOCUMENT_INVALID_TRANSITION',
    message: 'Invalid status transition',
  },
  ITEMS_REQUIRED: {
    code: 'DOCUMENT_ITEMS_REQUIRED',
    message: 'Sales and Purchase documents require at least one item before submission',
  },
  ALREADY_POSTED: {
    code: 'DOCUMENT_ALREADY_POSTED',
    message: 'Posted documents cannot be modified. Create a reversal document instead.',
  },
  APPROVAL_PENDING: {
    code: 'DOCUMENT_APPROVAL_PENDING',
    message: 'Document has pending approvals',
  },
  APPROVAL_NOT_FOUND: {
    code: 'DOCUMENT_APPROVAL_NOT_FOUND',
    message: 'Approval record not found',
  },
  APPROVAL_STEP_NOT_READY: {
    code: 'DOCUMENT_APPROVAL_STEP_NOT_READY',
    message: 'Previous approval steps must be completed first',
  },
  APPROVAL_ALREADY_DECIDED: {
    code: 'DOCUMENT_APPROVAL_ALREADY_DECIDED',
    message: 'This approval step has already been decided',
  },
  INVALID_DOCUMENT_TYPE: {
    code: 'DOCUMENT_INVALID_TYPE',
    message: 'Invalid or unsupported document type',
  },
  POSTING_ALREADY_PROCESSED: {
    code: 'DOCUMENT_POSTING_ALREADY_PROCESSED',
    message: 'Document has already been posted',
  },
  LEDGER_IMBALANCE: {
    code: 'DOCUMENT_LEDGER_IMBALANCE',
    message: 'Debit and credit amounts do not balance',
  },
  ACCESS_DENIED: {
    code: 'DOCUMENT_ACCESS_DENIED',
    message: 'You do not have access to this document',
  },
} as const;

// ============================================================================
// Tag Errors
// ============================================================================

export const TAG_ERRORS = {
  NOT_FOUND: {
    code: 'TAG_NOT_FOUND',
    message: 'Tag not found',
  },
  INVALID_NAME: {
    code: 'TAG_INVALID_NAME',
    message: 'Tag name must contain at least one non-whitespace character',
  },
  DUPLICATE_NAME: {
    code: 'TAG_DUPLICATE_NAME',
    message: 'Tag name already exists',
  },
  NAME_TOO_LONG: {
    code: 'TAG_NAME_TOO_LONG',
    message: 'Tag name exceeds the maximum length allowed for this tenant',
  },
  PATTERN_MISMATCH: {
    code: 'TAG_PATTERN_MISMATCH',
    message: 'Tag name does not match the tenant\'s allowed pattern',
  },
  LOCKED: {
    code: 'TAG_LOCKED',
    message: 'Tags cannot be modified once the document is approved or posted',
  },
} as const;

// ============================================================================
// Sales Errors
// ============================================================================

export const SALES_ERRORS = {
  NOT_FOUND: {
    code: 'SALES_NOT_FOUND',
    message: 'Sales record not found',
  },
  INVALID_STATUS: {
    code: 'SALES_INVALID_STATUS',
    message: 'Invalid sales document status for this action',
  },
  INVALID_PERSON: {
    code: 'SALES_INVALID_PERSON',
    message: 'Invalid person for sales document',
  },
  MISSING_APPROVAL_CONFIG: {
    code: 'SALES_MISSING_APPROVAL_CONFIG',
    message: 'No approval configuration found for this document type',
  },
  INVALID_TAX_MODE: {
    code: 'SALES_INVALID_TAX_MODE',
    message: 'Invalid tax pricing mode',
  },
} as const;

// ============================================================================
// Outbox Errors
// ============================================================================

export const OUTBOX_ERRORS = {
  NOT_FOUND: {
    code: 'OUTBOX_NOT_FOUND',
    message: 'Outbox event not found',
  },
  ALREADY_PROCESSED: {
    code: 'OUTBOX_ALREADY_PROCESSED',
    message: 'Outbox event has already been processed',
  },
  MAX_RETRIES_EXCEEDED: {
    code: 'OUTBOX_MAX_RETRIES_EXCEEDED',
    message: 'Maximum retry attempts exceeded',
  },
} as const;

// ============================================================================
// Validation Errors
// ============================================================================

export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: {
    code: 'VALIDATION_REQUIRED_FIELD',
    message: 'This field is required',
  },
  INVALID_FORMAT: {
    code: 'VALIDATION_INVALID_FORMAT',
    message: 'Invalid format',
  },
  INVALID_EMAIL: {
    code: 'VALIDATION_INVALID_EMAIL',
    message: 'Invalid email address',
  },
  MIN_LENGTH: {
    code: 'VALIDATION_MIN_LENGTH',
    message: 'Value is too short',
  },
  MAX_LENGTH: {
    code: 'VALIDATION_MAX_LENGTH',
    message: 'Value is too long',
  },
} as const;

// ============================================================================
// Member Errors
// ============================================================================

export const MEMBER_ERRORS = {
  NOT_FOUND: {
    code: 'MEMBER_NOT_FOUND',
    message: 'Member not found',
  },
  ALREADY_EXISTS: {
    code: 'MEMBER_ALREADY_EXISTS',
    message: 'Person already has a member record in this tenant',
  },
  PERSON_NOT_CUSTOMER: {
    code: 'MEMBER_PERSON_NOT_CUSTOMER',
    message: 'Linked person must be a customer',
  },
  PROFILE_INCOMPLETE: {
    code: 'MEMBER_PROFILE_INCOMPLETE',
    message: 'Member profile is incomplete',
  },
  TERMS_NOT_AGREED: {
    code: 'MEMBER_TERMS_NOT_AGREED',
    message: 'Member must agree to terms before activation',
  },
} as const;

// ============================================================================
// Aggregated Error Codes
// ============================================================================

export const ERROR_CODES = {
  AUTH: AUTH_ERRORS,
  TENANT: TENANT_ERRORS,
  USER: USER_ERRORS,
  ROLE: ROLE_ERRORS,
  TAX: TAX_ERRORS,
  PEOPLE: PEOPLE_ERRORS,
  DEPARTMENT: DEPARTMENT_ERRORS,
  ITEM: ITEM_ERRORS,
  CATEGORY: CATEGORY_ERRORS,
  IMPORT: IMPORT_ERRORS,
  STORAGE: STORAGE_ERRORS,
  THEME: THEME_ERRORS,
  VALIDATION: VALIDATION_ERRORS,
  DOCUMENT: DOCUMENT_ERRORS,
  TAG: TAG_ERRORS,
  OUTBOX: OUTBOX_ERRORS,
  SALES: SALES_ERRORS,
  MEMBER: MEMBER_ERRORS,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type AuthErrorCode = typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS];
export type TenantErrorCode = typeof TENANT_ERRORS[keyof typeof TENANT_ERRORS];
export type UserErrorCode = typeof USER_ERRORS[keyof typeof USER_ERRORS];
export type RoleErrorCode = typeof ROLE_ERRORS[keyof typeof ROLE_ERRORS];
export type TaxErrorCode = typeof TAX_ERRORS[keyof typeof TAX_ERRORS];
export type PeopleErrorCode = typeof PEOPLE_ERRORS[keyof typeof PEOPLE_ERRORS];
export type DepartmentErrorCode = typeof DEPARTMENT_ERRORS[keyof typeof DEPARTMENT_ERRORS];
export type ItemErrorCode = typeof ITEM_ERRORS[keyof typeof ITEM_ERRORS];
export type CategoryErrorCode = typeof CATEGORY_ERRORS[keyof typeof CATEGORY_ERRORS];
export type ImportErrorCode = typeof IMPORT_ERRORS[keyof typeof IMPORT_ERRORS];
export type StorageErrorCode = typeof STORAGE_ERRORS[keyof typeof STORAGE_ERRORS];
export type ThemeErrorCode = typeof THEME_ERRORS[keyof typeof THEME_ERRORS];
export type ValidationErrorCode = typeof VALIDATION_ERRORS[keyof typeof VALIDATION_ERRORS];
export type DocumentErrorCode = typeof DOCUMENT_ERRORS[keyof typeof DOCUMENT_ERRORS];
export type TagErrorCode = typeof TAG_ERRORS[keyof typeof TAG_ERRORS];
export type OutboxErrorCode = typeof OUTBOX_ERRORS[keyof typeof OUTBOX_ERRORS];
export type SalesErrorCode = typeof SALES_ERRORS[keyof typeof SALES_ERRORS];
export type MemberErrorCode = typeof MEMBER_ERRORS[keyof typeof MEMBER_ERRORS];

export type AnyErrorCode = 
  | AuthErrorCode 
  | TenantErrorCode 
  | UserErrorCode 
  | RoleErrorCode 
  | TaxErrorCode
  | PeopleErrorCode
  | DepartmentErrorCode
  | ItemErrorCode
  | CategoryErrorCode
  | ImportErrorCode
  | StorageErrorCode
  | ThemeErrorCode 
  | ValidationErrorCode
  | DocumentErrorCode
  | TagErrorCode
  | OutboxErrorCode
  | SalesErrorCode
  | MemberErrorCode;
