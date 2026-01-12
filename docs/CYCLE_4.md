# Cycle 4 Tickets: Catalog (Items + Categories + Media + Import/Export)

## Theme
Catalog master data for Gym-first POS, designed to extend to Eatery/Retail without changing the core item flow.

## Alignment with existing system (required)
- Audit columns: all new entities extend `BaseAuditEntity` so audit logs capture create/update/delete (per Cycle 1/2 patterns).
- Multi-tenant scoping: all Catalog endpoints filter by active tenant ID; guard order remains Auth -> ActiveTenant -> TenantMembership -> Permission.
- Error codes: use centralized error codes from `@gym-monorepo/shared` for all thrown exceptions.
- i18n: add new UI strings to `apps/web/src/locales/en.json` and `apps/web/src/locales/id.json`.
- API client: frontend uses axios `api`/`apiRaw` (no `fetch`).
- Permissions: add new `items.*` and `categories.*` permissions in shared constants and permission seed list.

## EPIC C4-0: Catalog Items + Categories

Goal: Provide tenant-scoped catalog items (product/service) with optional categories, SKU generation, and gym membership support.

### C4A-BE-01 - Category entity + migration
Scope:
- Create `categories` table with tenant scoping.
- Fields:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `parent_id` uuid nullable FK -> categories
  - `name` string (required)
  - `code` string, auto-generated per tenant
  - `status` enum: `ACTIVE | INACTIVE` (default `ACTIVE`)
  - audit columns + timestamps
- Constraints:
  - unique (`tenant_id`, `code`)
  - unique (`tenant_id`, `name`)
- Tree depth rule:
  - max 2 levels (root + one child)
  - creating/updating with `parent_id` must ensure parent has no parent
- Code generation: tenant counter key `categories` with prefix `CAT-` using the same transactional counter rules as People/Departments.

DoD:
- Migration runs successfully.
- Entity uses BaseAuditEntity and barrel imports.
- Depth rule enforced on create/update.

### C4A-BE-02 - Item entity + migration
Scope:
- Create `items` table with tenant scoping.
- Fields:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `category_id` uuid nullable FK -> categories
  - `type` enum: `PRODUCT | SERVICE`
  - `service_kind` enum: `MEMBERSHIP | PT_SESSION` nullable (only for `SERVICE`)
  - `code` string, auto-generated per tenant (SKU)
  - `name` string (required)
  - `price` numeric(12,2) (required)
  - `status` enum: `ACTIVE | INACTIVE` (default `ACTIVE`)
  - `barcode` string nullable (unique per tenant when present)
  - `unit` string nullable
  - `tags` jsonb array of strings (default `[]`)
  - `description` text nullable
  - `duration_value` int nullable
  - `duration_unit` enum: `DAY | WEEK | MONTH | YEAR` nullable
  - `session_count` int nullable (required for `PT_SESSION`)
  - `included_pt_sessions` int nullable (optional for `MEMBERSHIP`; when present this is a "package")
  - `image_key` string nullable
  - `image_url` string nullable
  - `image_mime_type` string nullable
  - `image_size` int nullable
  - audit columns + timestamps
- Constraints:
  - unique (`tenant_id`, `code`)
  - unique (`tenant_id`, `barcode`) where `barcode` is not null
  - enforce uniqueness for import upsert:
    - when `category_id` is null: unique (`tenant_id`, `name`, `type`) with a partial index
    - when `category_id` is not null: unique (`tenant_id`, `name`, `type`, `category_id`)
- Code generation: tenant counter key `items` with prefix `SKU-`.
- Tax handling: items do not store tax flags; tax inherits from tenant tax settings at transaction time.

Validation rules:
- `type=PRODUCT` => `service_kind`, `duration_*`, `session_count`, `included_pt_sessions` must be null.
- `type=SERVICE` => `service_kind` required.
- `service_kind=MEMBERSHIP` => `duration_value` + `duration_unit` required; `included_pt_sessions` optional.
- `service_kind=PT_SESSION` => `duration_value` + `duration_unit` + `session_count` required.

DoD:
- Migration runs successfully.
- Entity uses BaseAuditEntity and barrel imports.
- Service validation enforced in DTO/service layer.

### C4A-BE-03 - Catalog counters
Scope:
- Reuse `tenant_counters` for:
  - `categories` -> `CAT-{value:06d}`
  - `items` -> `SKU-{value:06d}`

DoD:
- SKU and category codes are unique per tenant and race-safe.

### C4A-BE-04 - Categories CRUD API
Scope:
- Base module path: `apps/api/src/modules/catalog/categories`.
- Guards: AuthGuard -> ActiveTenantGuard -> TenantMembershipGuard -> PermissionGuard.
- Endpoints:
  - `GET /catalog/categories?search=&status=&parentId=&page=&limit=`
  - `GET /catalog/categories/:id`
  - `POST /catalog/categories`
  - `PUT /catalog/categories/:id`
  - `DELETE /catalog/categories/:id` (soft, sets `status=INACTIVE`)
- Search matches: `code`, `name`.
- Depth rule enforced in create/update.
- Category is optional on items; no cascade delete.

DoD:
- CRUD works with pagination + filters.
- Depth rule enforced with validation error.

### C4A-BE-05 - Items CRUD API
Scope:
- Base module path: `apps/api/src/modules/catalog/items`.
- Guards: AuthGuard -> ActiveTenantGuard -> TenantMembershipGuard -> PermissionGuard.
- Endpoints:
  - `GET /catalog/items?type=&serviceKind=&categoryId=&status=&search=&page=&limit=`
  - `GET /catalog/items/:id`
  - `POST /catalog/items`
  - `PUT /catalog/items/:id`
  - `DELETE /catalog/items/:id` (soft, sets `status=INACTIVE`)
- Search matches: `code`, `name`, `barcode`, `tags`.
- Code is generated server-side; ignore any client-supplied `code`.

DoD:
- CRUD works with pagination + filters.
- Service validation rules enforced.

### C4A-BE-06 - Permissions
Scope:
- Add permission codes:
  - `items.read`, `items.create`, `items.update`, `items.delete`
  - `categories.read`, `categories.create`, `categories.update`, `categories.delete`
- Seed with group label `Catalog`.

DoD:
- Guarded access to all catalog endpoints.
- Permissions are visible in the Roles UI grouped under `Catalog`.

### C4A-BE-07 - Error codes + shared types
Scope:
- Add new error codes in `packages/shared`:
  - `ITEM_ERRORS.NOT_FOUND`
  - `ITEM_ERRORS.DUPLICATE_BARCODE`
  - `ITEM_ERRORS.INVALID_SERVICE_FIELDS`
  - `CATEGORY_ERRORS.NOT_FOUND`
  - `CATEGORY_ERRORS.DUPLICATE_NAME`
  - `CATEGORY_ERRORS.MAX_DEPTH`
- Add shared enums/types:
  - `ItemType`, `ItemServiceKind`, `ItemDurationUnit`
- Export from shared index and rebuild package.

DoD:
- Errors used in all catalog exceptions.

## EPIC C4-1: Item Media (MinIO)

Goal: Store a single image per item in MinIO with strict size/type validation.

### C4B-BE-01 - MinIO client + config
Scope:
- Add MinIO client configuration to API.
- Env placeholders in `.env.example`:
  - `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - `MINIO_BUCKET`, `MINIO_PUBLIC_URL`, `MINIO_USE_SSL`
- Max file size: 1MB
- Allowed types: common image formats (png, jpg, jpeg, webp, gif)

DoD:
- API can upload and retrieve item images via MinIO.

### C4B-BE-02 - Item image upload endpoint
Scope:
- Endpoint: `POST /catalog/items/:id/image`
- Multipart upload; validates type/size; stores to MinIO.
- Update `image_key`, `image_url`, `image_mime_type`, `image_size`.
- When replacing an image, delete the previous object.

DoD:
- Upload returns updated item with image fields.

### C4B-BE-03 - Import image URL handling
Scope:
- When import row includes `image_url`, backend downloads the image, validates size/type, stores in MinIO, and sets item image fields.

DoD:
- Import consistently results in stored MinIO assets.

### C4B-OPS-01 - Docker compose updates
Scope:
- Add MinIO service to `docker-compose.yml` with volume storage.
- Add `.env.example` entries for MinIO variables.

DoD:
- `pnpm docker:up` runs Postgres + API + Web + MinIO.

## EPIC C4-2: Import / Export

Goal: CSV/XLSX import/export for catalog items with selected fields.

### C4C-BE-01 - Item import (CSV/XLSX)
Scope:
- Endpoint: `POST /catalog/items/import` (multipart file)
- Supports `csv` and `xlsx`.
- Create-only with upsert behavior by (`name`, `type`, `category_id`).
- Auto-create categories when missing:
  - Use `category_name` for root
  - Use `parent_category_name` + `category_name` for child
- Optional `image_url` column triggers MinIO download and attach.

Columns (minimum):
- `name`, `type`, `service_kind`, `price`, `status`
- `category_name`, `parent_category_name`
- `barcode`, `unit`, `tags`, `description`
- `duration_value`, `duration_unit`, `session_count`, `included_pt_sessions`
- `image_url`

DoD:
- Import respects service validation rules.
- Category auto-creation respects depth rule (max 2 levels).

### C4C-BE-02 - Item export (CSV/XLSX)
Scope:
- Endpoint: `GET /catalog/items/export?format=csv|xlsx&fields=...`
- Supports selecting fields to export.
- Respects current filters (`type`, `serviceKind`, `categoryId`, `status`, `search`).

DoD:
- Export returns selected fields in requested format.

## EPIC C4-3: Frontend Catalog UI

Goal: Admin-friendly catalog management for gym operators, consistent with existing UI patterns.

### C4D-FE-01 - Sidebar + routes
Scope:
- Add new `Catalog` group in sidebar.
- Routes:
  - `/catalog/items`
  - `/catalog/items/new`
  - `/catalog/items/[id]`
  - `/catalog/items/[id]/edit`
  - `/catalog/categories`
  - `/catalog/categories/new`
  - `/catalog/categories/[id]/edit`
- Access guarded by `items.*` and `categories.*`.

DoD:
- Menu visibility respects permissions.

### C4D-FE-02 - Categories list + form
Scope:
- List: code, name, parent, status, actions.
- Form: name required, parent dropdown (enforce max depth), status editable on edit.
- "New Category" button gated by `categories.create`.

DoD:
- CRUD flows work end-to-end.

### C4D-FE-03 - Items list + detail + form
Scope:
- List: code (SKU), name, type, serviceKind, category, price, status, actions.
- Filters: type, serviceKind, category, status, search.
- Detail view: read-only display of all fields + image.
- Form: conditional fields for membership/PT session.
- Image upload: single image with 1MB limit and preview.
- "New Item" button gated by `items.create`.

DoD:
- CRUD + image upload work end-to-end.

### C4D-FE-04 - Import/Export UI
Scope:
- Import dialog: choose CSV/XLSX file, show validation errors.
- Export dialog: choose CSV/XLSX and field selection.

DoD:
- Import/export accessible from items list.

### C4D-FE-05 - i18n updates
Scope:
- Add translations for:
  - Catalog group label
  - Categories and Items labels
  - Form fields, validation messages, import/export UI
- If the Roles UI requires translated permission groups, add a mapping for `Catalog`.

DoD:
- All Catalog UI strings are translated.

## Seed Data (Gym defaults)

Goal: Provide a small demo dataset via seed scripts.

Seed categories (root/child):
- Memberships
- Services
- Supplements
- Beverages
- Merchandise
- Services -> Personal Training

Seed items (examples):
- Membership: Monthly (30 days), Quarterly (90 days), Annual (365 days)
- PT Session: Single (1 session, 30 days), Package (12 sessions, 30 days)
- Product: Vitamin C 1000mg, Mineral Water 600ml

Implementation:
- Add a new seeder (e.g., `catalog`) into `apps/api/src/scripts/seed.ts`.
- Add `pnpm --filter api seed --only catalog` helper script (and include in `seed:list`).

## Out of scope (deferred)
- Inventory/stock tracking
- Variants (size, color, etc.)
- Multiple images per item
- POS transaction flows (to be built on top of catalog)

## Suggested execution order (fastest, least blocked)
1. C4A-BE-01 -> C4A-BE-03 -> C4A-BE-04 (Categories)
2. C4A-BE-02 -> C4A-BE-05 -> C4A-BE-07 (Items + shared types/errors)
3. C4B-BE-01 -> C4B-BE-03 -> C4B-OPS-01 (MinIO)
4. C4C-BE-01 -> C4C-BE-02 (Import/Export)
5. C4D-FE-01 -> C4D-FE-05 (UI)
6. Seed data + QA checklist
