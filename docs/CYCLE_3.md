# Cycle 3 Tickets: People Core + Staff User Link

## Theme
- People master data (customer/supplier/staff) with tenant-scoped codes and staff-user linking.

## Alignment with existing system (required)
- **Audit columns:** all new entities extend `BaseAuditEntity` and include audit columns + timestamps so the audit subscriber logs changes (per existing audit system in Cycle 1/2).
- **Multi-tenant scoping:** all People endpoints must filter by active tenant ID; guard order remains Auth -> ActiveTenant -> TenantMembership -> Permission.
- **Error codes:** use centralized error codes from `@gym-monorepo/shared` (`PEOPLE_ERRORS`, `VALIDATION_ERRORS`, etc.).
- **i18n:** all new UI strings added to `apps/web/src/locales/en.json` and `apps/web/src/locales/id.json`, accessed via `useTranslations`.
- **API client:** frontend uses axios `api`/`apiRaw` (no `fetch`).

## EPIC C3-0: People Core (Master Data)

Goal: Introduce a tenant-scoped people master table with code generation, walk-in defaults, and CRUD + permissions.

### C3A-BE-01 - People entity + migration

Scope:
- Create `people` table with tenant scoping.
- Fields:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `type` enum: `CUSTOMER | SUPPLIER | STAFF`
  - `code` string, auto-generated per tenant + type
  - `full_name` string (required)
  - `email` string nullable
  - `phone` string nullable (normalized E.164-ish, e.g. `+62812...`)
  - `status` enum: `ACTIVE | INACTIVE` (default `ACTIVE`)
  - `tags` jsonb array of strings (default `[]`)
  - audit columns + timestamps
- Constraints:
  - unique (`tenant_id`, `code`)
  - unique (`tenant_id`, `email`) where `email` is not null
  - unique (`tenant_id`, `phone`) where `phone` is not null
- Soft delete: `DELETE /people/:id` sets `status=INACTIVE`.

DoD:
- Migration runs successfully.
- Entity uses BaseAuditEntity and barrel imports (audit columns included).
- Soft delete does not remove rows.

### C3A-BE-02 - Tenant counters for code generation

Scope:
- Create `tenant_counters` table:
  - `tenant_id` uuid
  - `key` string
  - `value` int
  - audit columns + timestamps
  - unique (`tenant_id`, `key`)
- Code keys and prefixes:
  - CUSTOMER -> `people.customer`, prefix `CUS-`
  - SUPPLIER -> `people.supplier`, prefix `SUP-`
  - STAFF -> `people.staff`, prefix `STF-`
- Generation rule (transactional):
  - `SELECT ... FOR UPDATE` by (`tenant_id`, `key`).
  - If missing, insert with `value=0` then re-read.
  - Increment by 1, store, and format as `{PREFIX}{value:06d}`.

DoD:
- Codes are unique per tenant+type and race-safe under concurrent writes.
- Counter entity uses BaseAuditEntity (audit columns present).

### C3A-BE-03 - Default walk-in customer

Scope:
- On tenant creation (or seed), create a CUSTOMER person:
  - `full_name = "Walk in"`
  - `tags = ["walk-in"]`
  - `code = CUS-000001` (generated via tenant counter)

DoD:
- Every tenant has a walk-in customer after create/seed.

### C3A-BE-04 - People CRUD API

Scope:
- Base module path: `apps/api/src/modules/people`.
- Guards: AuthGuard -> ActiveTenantGuard -> TenantMembershipGuard -> PermissionGuard.
- Endpoints:
  - `GET /people?type=&search=&status=&page=&limit=`
  - `GET /people/:id`
  - `POST /people`
  - `PUT /people/:id`
  - `DELETE /people/:id` (soft, sets `status=INACTIVE`)
- Code is always generated server-side; ignore any client-supplied `code`.
- If deleting a STAFF record with a linked user, auto-unlink `user_id` before setting `status=INACTIVE`.
- Search matches: `code`, `full_name`, `email`, `phone`.
- Duplicate checks return 409:
  - `DUPLICATE_EMAIL` when email conflict in same tenant
  - `DUPLICATE_PHONE` when phone conflict in same tenant
- Phone normalization (Indonesia):
  - Accept `0812...`, `62...`, `+62...`.
  - Normalize to `+62...` with digits only after prefix.
  - Invalid input -> 400 validation error.

DoD:
- List endpoint paginates and filters correctly.
- Create/update normalize phone and enforce unique constraints.
- Soft delete flips status and keeps row.

### C3A-BE-05 - Invite existing people across tenants

Scope:
- Add invitable search similar to tenant-users:
  - `GET /people/invitable?type=&search=&page=&limit=`
  - Exclude records from the active tenant.
  - Only return people with `email` or `phone` present (dedupe key).
  - Search matches: code, full_name, email, phone.
  - Return minimal fields: `id`, `type`, `fullName`, `email`, `phone`, `tags`.
- Add invite endpoint:
  - `POST /people/invite` payload `{ personId: string }`
  - Clones the selected person into the active tenant (new code, same fields).
  - Reject with 409 on duplicate email/phone in the active tenant.

Permissions:
- Invitable search + invite require `people.create`.

DoD:
- Users with `people.create` can search across other tenants and add existing people into the active tenant.
- Invite respects duplicate rules and generates a new code.

### C3A-BE-06 - Permissions

Scope:
- Add permission codes:
  - `people.read`, `people.create`, `people.update`, `people.delete`
- Seed into permissions list.
- Apply `@RequirePermissions()` per endpoint.

DoD:
- Guards enforce access for all people endpoints.

### C3A-FE-01 - Sidebar + routes

Scope:
- Add People section in sidebar:
  - `/people` (route folder under `/app/(authenticated)/people`, requires any `people.*` permission)
- Routes:
  - `/people` (list)
  - `/people/new`
  - `/people/[id]/edit`

DoD:
- Menu and route guards respect permissions.

### C3A-FE-02 - People list page

Scope:
- Filters: Type (CUSTOMER/SUPPLIER/STAFF), Status (ACTIVE/INACTIVE), Search.
- Columns: Code, Name, Type badge, Phone, Email, Tags (chips), Status badge, Actions.
- Actions: edit, deactivate (soft delete).
- "New Person" button gated by `people.create`.
- "Invite Existing" button opens a dialog that searches `/people/invitable` and calls `/people/invite`.

DoD:
- List supports search + pagination.
- Actions respect permissions.

### C3A-FE-03 - People form (new/edit)

Scope:
- Required: Full name.
- Optional: Type, Phone, Email, Tags.
- Status editable on edit only.
- Code is read-only (display-only on edit, not part of create form).

DoD:
- Create and edit flows work end-to-end.

### C3A-FE-04 - Invite existing people dialog

Scope:
- Searchable select backed by `/people/invitable` (filters by type/search).
- Confirm action calls `/people/invite`.
- Surface duplicate email/phone errors inline.

DoD:
- Existing people can be added to the active tenant without retyping.

## EPIC C3-1: Staff User Link + Create User for Staff

Goal: Allow staff to exist without login, and optionally link/create user accounts.

### C3B-BE-01 - Staff fields on people

Scope:
- Add STAFF-only fields to `people`:
  - `department` string nullable (temporary; will be migrated to `departmentId` FK in C3C-BE-04)
  - `user_id` uuid nullable FK -> users
- Constraints:
  - unique (`tenant_id`, `user_id`) where `user_id` is not null
  - enforce global uniqueness for STAFF: user cannot link to STAFF in another tenant
    - Recommended: unique partial index on (`user_id`) where `type = 'STAFF'`

DoD:
- Migrations add columns and enforce uniqueness.

### C3B-BE-02 - Staff user linking endpoints

Scope:
- `GET /people/staff/invitable-users?search=&page=&limit=`
  - Exclude users already linked to any STAFF record (all tenants).
  - Exclude super admins (match existing invitable-user patterns).
- `PUT /people/:id/link-user` with `{ userId }`
- `PUT /people/:id/unlink-user` sets `userId = null`
- Validation:
  - Person must be type STAFF.
  - User must not be linked elsewhere.

Permissions:
- Link/unlink requires `people.update`.

DoD:
- Linking/unlinking works and respects constraints.

### C3B-BE-03 - Create user for staff

Scope:
- `POST /people/:id/create-user` payload:
  - `email`, `fullName`, `tempPassword`, `attachToTenant`, `roleId`
- Behavior:
  - Create platform user.
  - Attach to active tenant with role (when `attachToTenant=true`).
  - Link user to staff record.
  - Reject if email already exists.

Permissions:
- Require `users.create` + `users.assignRole` (and still enforce `people.update` for link).

DoD:
- Single action creates user, attaches to tenant, and links to staff.

### C3B-FE-01 - Staff form UX

Scope:
- Staff-only section appears when `type=STAFF`:
  - Department input
  - User link card
- User link card:
  - If linked: show user email + "Unlink" button
  - If not linked: "Link existing user" select + "Create new user" dialog
- No auto-sync between person and user fields.

DoD:
- Staff link UX works and respects permissions.

### C3B-FE-02 - Create-user dialog

Scope:
- Dialog fields: email, temp password, role select.
- Submit hits `/people/:id/create-user`.

DoD:
- Creates user, attaches to tenant, links to staff.

## EPIC C3-2: Departments Module

Goal: Provide a tenant-scoped Departments master table with CRUD, permissions, and link to Staff records.

### C3C-BE-01 - Department entity + migration

Scope:
- Create `departments` table with tenant scoping.
- Fields:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `name` string (required)
  - `code` string, auto-generated per tenant
  - `status` enum: `ACTIVE | INACTIVE` (default `ACTIVE`)
  - audit columns + timestamps
- Constraints:
  - unique (`tenant_id`, `code`)
  - unique (`tenant_id`, `name`)
- Code generation: `DEP-{value:06d}` using tenant counters key `departments`

DoD:
- Migration runs successfully.
- Entity uses BaseAuditEntity and barrel imports.

### C3C-BE-02 - Departments CRUD API

Scope:
- Base module path: `apps/api/src/modules/departments`.
- Guards: AuthGuard -> ActiveTenantGuard -> TenantMembershipGuard -> PermissionGuard.
- Endpoints:
  - `GET /departments?search=&status=&page=&limit=`
  - `GET /departments/:id`
  - `POST /departments`
  - `PUT /departments/:id`
  - `DELETE /departments/:id` (soft, sets `status=INACTIVE`)
- Code is always generated server-side; ignore any client-supplied `code`.
- Search matches: `code`, `name`.
- Duplicate check returns 409 `DUPLICATE_NAME`.

DoD:
- List endpoint paginates and filters correctly.
- Soft delete flips status and keeps row.

### C3C-BE-03 - Permissions for departments

Scope:
- Add permission codes:
  - `departments.read`, `departments.create`, `departments.update`, `departments.delete`
- Seed into permissions list.
- Apply `@RequirePermissions()` per endpoint.

DoD:
- Guards enforce access for all department endpoints.

### C3C-BE-04 - Update people entity (department FK)

Scope:
- Add migration to:
  1. Add `departmentId` uuid nullable FK -> departments
  2. Migrate existing `department` string values to department records (or null)
  3. Drop `department` string column
- Update entity:
  - Replace `department: string | null` with `departmentId: string | null`
  - Add relation to DepartmentEntity
- Update DTOs and service to handle `departmentId`.

DoD:
- People entity uses FK instead of string.
- Existing data is migrated.

### C3C-FE-01 - Departments sidebar + routes

Scope:
- Add Departments section in sidebar (under Settings or standalone):
  - `/departments` (requires any `departments.*` permission)
- Routes:
  - `/departments` (list)
  - `/departments/new`
  - `/departments/[id]/edit`

DoD:
- Menu and route guards respect permissions.

### C3C-FE-02 - Departments list + form pages

Scope:
- List page:
  - Columns: Code, Name, Status badge, Actions.
  - Actions: edit, deactivate.
  - "New Department" button gated by `departments.create`.
- Form page:
  - Required: Name.
  - Status editable on edit only.
  - Code is read-only (display-only on edit).

DoD:
- CRUD flows work end-to-end.

### C3B-FE-01 update - Staff form uses department dropdown

Note: Update C3B-FE-01 to:
- Replace department text input with a dropdown.
- Dropdown fetches from `GET /departments?status=ACTIVE`.
- Allow clearing (null departmentId).

## Shared updates

- Add people types and error codes to `packages/shared`:
  - `PEOPLE_ERRORS.DUPLICATE_EMAIL`, `PEOPLE_ERRORS.DUPLICATE_PHONE`, `PEOPLE_ERRORS.INVALID_PHONE`, `PEOPLE_ERRORS.NOT_FOUND`.
- Add department error codes:
  - `DEPARTMENT_ERRORS.DUPLICATE_NAME`, `DEPARTMENT_ERRORS.NOT_FOUND`.
- Add permissions constants for `people.*` and `departments.*`.

## Suggested execution order

1. C3A-BE-01 -> C3A-BE-02 -> C3A-BE-03
2. C3A-BE-04 -> C3A-BE-06
3. C3A-FE-01 -> C3A-FE-04
4. C3C-BE-01 -> C3C-BE-02 -> C3C-BE-03 (Departments backend)
5. C3C-BE-04 (Update people.department -> departmentId)
6. C3C-FE-01 -> C3C-FE-02 (Departments frontend)
7. C3B-BE-01 -> C3B-BE-03 (Staff user linking)
8. C3B-FE-01 -> C3B-FE-02 (Staff form with department dropdown)
