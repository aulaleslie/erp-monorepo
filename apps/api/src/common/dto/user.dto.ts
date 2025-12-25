/**
 * Centralized response DTOs for user-related entities
 * These DTOs ensure consistent response shapes across all services
 */

/**
 * User response DTO - sanitized user data for API responses
 */
export interface UserResponseDto {
  id: string;
  email: string;
  fullName?: string;
  status: string;
}

/**
 * Role response DTO - role data for API responses
 */
export interface RoleResponseDto {
  id: string;
  name: string;
  isSuperAdmin: boolean;
}

/**
 * Tenant user response DTO - tenant membership with user and role info
 */
export interface TenantUserResponseDto {
  tenantId: string;
  userId: string;
  roleId: string | null;
  user: UserResponseDto | null;
  role: RoleResponseDto | null;
}

/**
 * Transform a user entity to response DTO
 */
export function toUserResponseDto(user: {
  id: string;
  email: string;
  fullName?: string;
  status: string;
}): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
  };
}

/**
 * Transform a role entity to response DTO
 */
export function toRoleResponseDto(role: {
  id: string;
  name: string;
  isSuperAdmin: boolean;
}): RoleResponseDto {
  return {
    id: role.id,
    name: role.name,
    isSuperAdmin: role.isSuperAdmin,
  };
}

/**
 * Build a tenant user response DTO
 */
export function toTenantUserResponseDto(
  membership: { tenantId: string; userId: string; roleId: string | null },
  user: { id: string; email: string; fullName?: string; status: string } | null,
  role: { id: string; name: string; isSuperAdmin: boolean } | null,
): TenantUserResponseDto {
  return {
    tenantId: membership.tenantId,
    userId: membership.userId,
    roleId: membership.roleId,
    user: user ? toUserResponseDto(user) : null,
    role: role ? toRoleResponseDto(role) : null,
  };
}
