# Cycle 2 Tickets: Tenant Flags + Platform Taxes + Tenant Tax Settings

## EPIC C2-0: Tenant Capabilities + Taxes Foundation

Goal: Add isTaxable/isEatery, platform tax master data, tenant tax settings UI/API, all guarded and auditable.

## Backend Tickets (apps/api)

### C2-BE-01 - Add tenant capability flags (migration + entity + DTO)

Scope:
- Add columns to `tenants`:
  - `is_taxable` boolean default false
  - `is_eatery` boolean default false
- Update the Tenant entity mapping.
- Ensure tenant DTOs include these flags in:
  - `GET /me/tenants`
  - `GET /me/tenants/active`
  - `GET /tenants/:id` (platform view)

DoD:
- Migration runs successfully.
- Flags appear in responses and are persisted.
- Audit log records tenant updates (already via subscriber).

### C2-BE-02 - Add platform taxes entity + migration

Scope:
- Create `taxes` table with:
  - `id`, `code` (unique, optional but recommended), `name`
  - `type`: `PERCENTAGE` | `FIXED` (default `PERCENTAGE`)
  - `rate` numeric(10,4) (for percentage)
  - `amount` numeric(12,2) nullable (for fixed)
  - `status`: `ACTIVE` | `INACTIVE` (default `ACTIVE`)
  - timestamps + audit columns (consistent with core entities)

DoD:
- Migration creates table and enums.
- Entity created and wired with TypeORM.
- Audit subscriber logs create/update/delete (including status changes).

### C2-BE-03 - Platform taxes CRUD API (Super Admin only, paginated)

Scope:
- Module path: `src/platform/taxes`
- Endpoints (BaseResponse + pagination):
  - `GET /platform/taxes?search=&status=&page=&limit=`
  - `GET /platform/taxes/:id`
  - `POST /platform/taxes`
  - `PUT /platform/taxes/:id`
  - `DELETE /platform/taxes/:id` -> soft disable sets `status=INACTIVE`
- Guards:
  - `AuthGuard`
  - `SuperAdminGuard` (hard gate)
- Validation:
  - `PERCENTAGE`: `0 < rate <= 1`
  - `FIXED`: `amount > 0`
  - `code` unique when provided

DoD:
- All endpoints work.
- Non-super-admin gets 403 consistently.
- List endpoint supports pagination and filtering.
- Soft disable works and shows `INACTIVE` in listing.

### C2-BE-04 - Tenant tax mapping entity + migration

Scope:
- Create `tenant_taxes` mapping:
  - `tenant_id`
  - `tax_id`
  - `is_default` boolean default false
  - timestamps
- Constraints:
  - unique (`tenant_id`, `tax_id`)
  - enforce one default per tenant in service logic

DoD:
- Migration runs.
- FK constraints ok.
- Entity created.

### C2-BE-05 - Tenant tax settings API (tenant-scoped, tenant-admin enabled)

Scope:
- Module: `src/tenant-settings/tax`
- Endpoints:
  - `GET /tenant-settings/tax`
  - `PUT /tenant-settings/tax`
- GET returns:
  - `isTaxable` (from tenant)
  - `selectedTaxIds`
  - `defaultTaxId`
  - (optional) tax objects for display
- PUT payload: `{ taxIds: string[], defaultTaxId?: string }`
- Guards:
  - `AuthGuard`
  - `ActiveTenantGuard`
  - `TenantMembershipGuard`
  - `PermissionGuard` with `settings.tenant.read`/`settings.tenant.update`
- Rules:
  - If `tenant.isTaxable=false`, PUT returns 409 (or 400) `TENANT_NOT_TAXABLE`.
  - Only `ACTIVE` taxes can be selected.
  - If `defaultTaxId` is provided it must be included in `taxIds`.
  - If no `defaultTaxId` is provided, the first `taxId` becomes default.
  - Update is transactional (replace set).

DoD:
- GET works for taxable and non-taxable tenants.
- PUT rejects when tenant not taxable.
- PUT rejects inactive/nonexistent taxes.
- Default tax logic correct.
- Audit logs reflect changes (mapping changes ok).

### C2-BE-06 - Permissions note (Cycle 2)

Scope:
- No new tax-specific permissions are required.
- Tenant tax settings are governed by `settings.tenant.read`/`settings.tenant.update`.
- Platform tax CRUD remains Super Admin only.

DoD:
- Existing permission seeds cover tenant tax settings access.

## Frontend Tickets (apps/web)

### C2-FE-01 - Extend tenant shape in AuthContext and services

Scope:
- Update tenant types to include:
  - `isTaxable`
  - `isEatery`
- Ensure `/me/tenants` and `/me/tenants/active` service calls map these fields.
- Ensure tenant switch refresh rehydrates flags.

DoD:
- Active tenant flags available in `AuthContext.activeTenant`.
- No TS errors.
- Switching tenant updates flags correctly.

### C2-FE-02 - Sidebar updates with Settings/Users structure

Scope:
- Replace the Platform group with Settings + Users groups.
- Settings menu items:
  - Tenant (`/settings/tenant`): visible to Super Admins or users with `settings.tenant.read`/`settings.tenant.update`.
  - Tenants (`/settings/tenants`): Super Admin only.
  - Taxes (`/settings/taxes`): Super Admin only.
  - Audit Logs (`/settings/audit-logs`): Super Admin only.
- Users menu items:
  - Roles (tenant-scoped).
  - Users (tenant-scoped).
- Do not gate Settings visibility by active tenant flags; the Taxes menu stays visible for Super Admins even when `activeTenant.isTaxable` is false.

DoD:
- Menu items appear/hide correctly based on context and permissions.
- Sidebar collapse and tooltips still work.

### C2-FE-03 - Taxes screen (Platform taxes CRUD)

Scope:
- Route: `/settings/taxes`
- UI:
  - Table columns: Name, Code, Type, Rate/Amount, Status, UpdatedAt, Actions
  - Filters: Search + Status
  - Pagination: reuse existing pagination hook
  - Create/Edit: dialog or page using shadcn Form components
  - Disable: ConfirmDialog triggers soft-delete endpoint
- Guards:
  - Page-level super admin check (redirect or show 403)
  - Action buttons permission-aware (optional since super admin)

DoD:
- Full CRUD works end-to-end on `/settings/taxes`.
- Disabled taxes show as `INACTIVE`.
- Toasts + inline server errors show correctly.

### C2-FE-04 - Tenant tax settings section (multi-select + default)

Scope:
- Route: `/settings/tenant`
- Super Admins can jump to tax configuration from `/settings/tenants` via a "Configure taxes" action that sets the active tenant and routes to `/settings/tenant`.
- Behavior:
  - If user lacks `settings.tenant.read`/`settings.tenant.update`:
    - show a 403/EmptyState and block access
  - If `activeTenant.isTaxable=false`:
    - show informational EmptyState/StatusBadge
  - Else:
    - show "Applicable taxes" multi-select
    - use SearchableSelect (debounced) hitting `/platform/taxes?status=ACTIVE&search=...`
    - show "Default tax" select limited to selected taxes
    - Save button guarded by `settings.tenant.update`
- Show inline server validation errors.

DoD:
- Works for taxable and non-taxable tenants on `/settings/tenant`.
- Saves selected taxes + default.
- Reload reflects saved settings.

### C2-FE-05 - Add client-side validation (Zod) for tax forms

Scope:
- Platform tax create/edit schema:
  - `name` required
  - percentage `rate` between `(0, 1]`
  - fixed `amount > 0`
- Tenant settings schema:
  - `taxIds` non-empty when taxable
  - `defaultTaxId` must be among selected

DoD:
- Prevents obvious bad submissions.
- Server-side errors still handled.

## QA / Release Tickets

### C2-QA-01 - Manual verification script (smoke test)

Scope:
- Document steps:
  - Super admin creates tax (ACTIVE).
  - Super admin sets tenant `isTaxable` true (via tenant edit).
  - Tenant tax settings selects taxes + default on `/settings/tenant`.
  - From `/settings/tenants`, use "Configure taxes" to switch the active tenant and update tax settings.
  - Disable a tax; verify it no longer selectable but remains visible if already selected.

DoD:
- Repeatable checklist in `docs/CYCLE_2.md`.

### C2-REL-01 - Update docs + tag release

Scope:
- Update README:
  - tenant flags
  - taxes module overview
  - tenant tax settings
- Tag git: `v2.0-tax`

DoD:
- Docs are accurate.
- Release tag created.

## Suggested execution order (fastest, least blocked)

1. C2-BE-01 -> C2-BE-02 -> C2-BE-03
2. C2-BE-04 -> C2-BE-05 -> C2-BE-06
3. C2-FE-01 -> C2-FE-02 -> C2-FE-03 -> C2-FE-04 -> C2-FE-05
4. C2-QA-01 -> C2-REL-01
