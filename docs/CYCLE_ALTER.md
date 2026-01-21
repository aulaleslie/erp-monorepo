# Cycle ALTER — Document Engine + Tags Foundation

## Theme
Prepare a reusable document engine with outbox + Redis so future modules
(sales, purchase, accounting, inventory) can issue documents consistently.

## Document Engine Definition
- Document header (generic): identity, numbering, dates, currency, tenant, people
  (customers/suppliers), status, totals snapshot, metadata.
- Document items (generic): item/service references, qty/price/tax fields,
  dimensions, metadata.
- Single currency per tenant (IDR - Indonesian Rupiah in v1).
- Workflow: DRAFT -> SUBMITTED -> APPROVED -> POSTED (terminal), with
  CANCELLED (pre-post), REJECTED, and REVISION_REQUESTED branches.
- Posting pipeline: document-type-specific handlers write ledger entries and
  outbox events atomically + idempotently.
- Outbox events: durable `document.*` events plus module events like
  `sales.invoice.posted`.
- Audit: approvals and status history per document.
- Extensibility: module-specific extensions attach to headers/items (1:1 or 1:n)
  when needed.

## Integration model (modules as plugins)
- Document type definitions live in code constants (no user-configurable fields
  in this cycle).
- Each document type defines required fields, numbering series, workflow rules,
  validation rules, and a posting handler.
- Example document keys (registry): `sales.order`, `sales.invoice`,
  `purchasing.po` (purchase order), `purchasing.grn` (goods receipt note),
  `accounting.journal` (general journal), `inventory.transfer` (stock transfer),
  `inventory.adjustment` (stock adjustment), `inventory.count` (cycle count).
- Modules can add extension tables later (e.g., `sales_headers`, `sales_lines`)
  without changing the core engine.

## Alignment with existing system (required)
- Persistence: TypeORM migrations, `synchronize: false` (Cycle 0).
- Guards: AuthGuard -> ActiveTenantGuard -> TenantMembershipGuard -> PermissionGuard
  (Cycle 1, section 7).
- Auditing: new tables extend `BaseAuditEntity` so audit logs are captured
  (Cycle 1/2 patterns).
- Tenant scoping: all document + tag data filtered by active tenant (Cycle 1).
- Taxes: document tax snapshots use tenant tax settings from Cycle 2.
- Permissions + errors: centralized constants in `@gym-monorepo/shared` (Cycle 1).
- Tenant-scoped configuration: use dedicated tables aligned with Cycle 2 guard
  patterns (not user-editable in this cycle).

## EPIC CA-0: Document Engine Core

Goal: Introduce generic headers + items, workflow, numbering, posting pipeline,
and access rules without tying to specific modules yet.

### CA-BE-01 — Core document headers + items (migration + entities)
Scope:
- Create `documents` table:
  - `id` uuid (UUID, universally unique identifier) primary key (PK)
  - `tenant_id` uuid foreign key (FK) -> tenants
  - `module` enum: `SALES | PURCHASE | ACCOUNTING | INVENTORY`
  - `document_key` string (code constant like `sales.invoice`)
  - `number` string (unique per tenant + document_key)
  - `status` enum: `DRAFT | SUBMITTED | REVISION_REQUESTED | REJECTED | APPROVED | POSTED | CANCELLED`
  - `document_date` timestamptz
  - `due_date` timestamptz nullable
  - `posting_date` timestamptz nullable
  - `currency_code` string (ISO 4217 currency code standard, fixed to `IDR` in v1)
  - `exchange_rate` numeric(12,6) default 1
  - `person_id` uuid nullable FK -> people
  - `person_name` string nullable (snapshot)
  - `subtotal`, `discount_total`, `tax_total`, `total` numeric(12,2)
  - `metadata` jsonb (JSONB, binary JSON) nullable
  - `created_by_user_id` uuid FK -> users
  - `submitted_at`, `approved_at`, `posted_at`, `cancelled_at`,
    `rejected_at`, `revision_requested_at`
  - `notes` text nullable
  - audit columns + timestamps
- Note: `person_id` references `people`. Expected PeopleType is
  CUSTOMER for sales and SUPPLIER for purchase documents (enforced in service).
- Create `document_items` table:
  - `id` uuid PK
  - `document_id` uuid FK -> documents
  - `item_id` uuid FK -> items
  - `item_name` string (snapshot)
  - `item_type` string (snapshot)
  - `description` text nullable
  - `quantity` numeric(12,4)
  - `unit_price` numeric(12,2)
  - `discount_amount` numeric(12,2) default 0
  - `tax_amount` numeric(12,2) default 0
  - `line_total` numeric(12,2)
  - `dimensions` jsonb nullable
  - `metadata` jsonb nullable
  - `sort_order` int default 0
  - audit columns + timestamps
- Create `document_tax_lines` table for tax snapshots:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_id` uuid FK -> documents
  - `document_item_id` uuid FK -> document_items nullable
  - `tax_id` uuid FK -> taxes nullable
  - `tax_name` string
  - `tax_type` string
  - `tax_rate` numeric(10,4) nullable
  - `tax_amount` numeric(12,2)
  - `taxable_base` numeric(12,2)
  - audit columns + timestamps
- Rule: SALES/PURCHASE documents require at least one item before SUBMITTED.
- Create `document_account_lines` table (accounting-only lines):
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_id` uuid FK -> documents
  - `account_id` uuid FK -> chart_of_accounts
  - `description` text nullable
  - `debit_amount` numeric(12,2) default 0
  - `credit_amount` numeric(12,2) default 0
  - `cost_center_id` uuid FK -> cost_centers nullable
  - `metadata` jsonb nullable
  - `sort_order` int default 0
  - audit columns + timestamps
  - constraint: exactly one of `debit_amount` or `credit_amount` is > 0
- Balance rule: enforce sum(debit) = sum(credit) on POSTED only.
- Create minimal `chart_of_accounts` table (needed for accounting lines/ledger):
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `code` string
  - `name` string
  - `type` enum: `ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE`
  - `parent_id` uuid nullable FK -> chart_of_accounts
  - `is_active` boolean default true
  - audit columns + timestamps
  - unique (`tenant_id`, `code`)
- Create minimal `cost_centers` table (ledger dimension):
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `code` string
  - `name` string
  - `is_active` boolean default true
  - audit columns + timestamps
  - unique (`tenant_id`, `code`)
- Constraints:
  - unique (`tenant_id`, `document_key`, `number`)
  - no cascade deletes from items (preserve historical snapshots)
  - metadata fields are validated against a document_key whitelist (no free-form schema drift).
  - add GIN indexes on `documents.metadata` and `documents.person_name` for search.
  - tax lines use tenant default tax settings (Cycle 2) and snapshot rate/name.

DoD (definition of done):
- Migration runs successfully.
- Entities use BaseAuditEntity and entity barrel imports.
- Document header + items cover totals, pricing, and snapshot fields.
- Tax snapshots stored in document_tax_lines.
- Document types are enforced by code constants (no user-configurable types).
- Accounting lines reference chart_of_accounts with cost center dimensions.
- Currency is enforced as single-tenant `IDR`.

### CA-BE-02 — Workflow + approvals + status history
Scope:
- Create `document_approvals` table:
  - `id` uuid PK
  - `document_id` uuid FK -> documents
  - `step_index` int
  - `status` enum: `PENDING | APPROVED | REJECTED | REVISION_REQUESTED`
  - `requested_by_user_id` uuid FK -> users
  - `decided_by_user_id` uuid FK -> users nullable
  - `notes` text nullable
  - `decided_at` timestamptz nullable
  - audit columns + timestamps
- Create `document_status_history` table:
  - `id` uuid PK
  - `document_id` uuid FK -> documents
  - `from_status`, `to_status` enums
  - `changed_by_user_id` uuid FK -> users
  - `reason` text nullable
  - `changed_at` timestamptz
- Enforce state machine:
  - DRAFT -> SUBMITTED -> APPROVED -> POSTED (terminal)
  - SUBMITTED -> REJECTED (terminal)
  - SUBMITTED -> REVISION_REQUESTED -> DRAFT
  - DRAFT/SUBMITTED/APPROVED -> CANCELLED (pre-post cancel)
  - Posted documents require reversal documents (no cancel after POSTED).
- Add DocumentService methods for:
  - create/update header + items
  - submit, approve, post, cancel, request revision
- Totals are calculated server-side; client totals are validated/ignored.
- Expose internal endpoints for verification (no user interface (UI) usage yet).
- Approvals are configurable per document_key (multi-step supported).
- Revision notes live in document_status_history.reason.

DoD:
- Status transitions are enforced in services.
- Approvals and history are recorded for every transition.

### CA-BE-03 — Document numbering settings
Scope:
- Create `document_number_settings` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_key` string
  - `prefix` string
  - `padding_length` int
  - `include_period` boolean
  - `period_format` string default `yyyy-MM`
  - timestamps
- Unique (`tenant_id`, `document_key`)
- Numbering format: `{prefix}-{yyyy}-{mm}-{counter}` when include_period is true.
- Use `tenant_counters` for counters per tenant + document_key.
- Assign document number at creation (DRAFT).
- Seed default numbering rows per document_key.
- Extend tenant settings API and UI (Cycle 2 patterns):
  - Allow configuring document prefixes/padding during tenant create/update.
  - Store values in document_number_settings.

DoD:
- Unique numbers per tenant + document_key.
- Prefix and padding configurable via document_number_settings.
- document_number_settings is the single source of numbering config.

### CA-BE-04 — Document type registry + posting handlers
Scope:
- Define document type constants (code registry) such as:
  - `sales.order`, `sales.invoice`
  - `purchasing.po`, `purchasing.grn`
  - `accounting.journal`
  - `inventory.transfer`, `inventory.adjustment`, `inventory.count`
- For each document type, register:
  - module (`SALES | PURCHASE | ACCOUNTING | INVENTORY`)
  - required header fields and line rules
  - allowed workflow transitions
  - numbering series key
  - posting handler
- Maintain a seed table for registry visibility (read-only mirror of constants),
  so services can query supported document_key values without user edits.
- Create minimal `ledger_entries` table (stub) for posting output:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_id` uuid FK -> documents
  - `entry_type` enum: `DEBIT | CREDIT`
  - `account_id` uuid FK -> chart_of_accounts
  - `account_code` string (snapshot)
  - `amount` numeric(12,2)
  - `currency_code` string (fixed to `IDR` in v1)
  - `cost_center_id` uuid FK -> cost_centers nullable
  - `posted_at` timestamptz
  - `metadata` jsonb nullable
  - audit columns + timestamps
- Add a PostingHandler interface and base implementation:
  - `post(documentId)` validates state and loads header + items.
  - Writes minimal ledger entries (stub) and outbox events atomically.
  - Enforces idempotency using `document_id + event_version`.
  - Creates ledger entries only on POSTED (no provisional entries).

DoD:
- Document types are validated through a registry, not hard-coded per module.
- Posting transitions move documents to POSTED and write outbox events.

### CA-BE-05 — Row-level access rules
Scope:
- Enforce row-level access in document queries:
  - Default scope: tenant-wide access based on permissions.
  - Optional creator-only access using `created_by_user_id`.
  - Prepare for future role/department scoping (no department FK yet).
- Add `document_access_scope` enum and store on documents:
  - `TENANT | CREATOR | ROLE | USER`
- Store optional `access_role_id` / `access_user_id` on documents.
- Access scope default is TENANT; all document queries are scoped by active tenant.
  A user must switch active tenant to see documents created under another tenant.
- Per-document overrides (ROLE/USER) are reserved for future use.
- Permissions model (hybrid):
  - Core: `documents.read`, `documents.submit`, `documents.approve`,
    `documents.post`, `documents.cancel`
  - Module: `sales.*`, `purchasing.*`, `accounting.*`, `inventory.*`
  - Require both core + module permission when applicable.

DoD:
- Access is enforced in document services for list/detail.
- Creator-only access works for restricted docs.
- documents.* and module permissions are added to shared constants and seeds.

## EPIC CA-1: Outbox + Worker + Redis

Goal: Prepare event-driven processing for document events and downstream sync
later (inventory, accounting).

### CA-BE-06 — Document outbox
Scope:
- Create `document_outbox` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_id` uuid FK -> documents
  - `event_key` string (e.g., `document.submitted`, `document.posted`,
    `document.cancelled`, `document.tags_updated`, `sales.invoice.posted`)
  - `event_version` int (increment per document)
  - `status` enum: `PENDING | PROCESSING | DONE | FAILED`
  - `attempts` int default 0
  - `next_attempt_at` timestamptz nullable
  - `last_error` text nullable
  - timestamps + audit columns
- Insert outbox rows in the same transaction as document changes.

DoD:
- Outbox rows persist for all lifecycle transitions and posting events.
- Event version increments per document.

### CA-BE-07 — Worker foundation (BullMQ + Redis)
Scope:
- Add BullMQ worker inside `apps/api`:
  - Single global queue (`doc-engine`) with tenant_id on jobs.
  - Processor loads document + event from database (DB).
  - Handlers defined but only stub behavior in this cycle (no downstream writes).
- Retry with exponential backoff based on `attempts`.

DoD:
- Worker boots with API.
- Outbox items are pulled and marked DONE/FAILED.
- Jobs are enqueued to the global `doc-engine` queue with tenant_id.

### CA-BE-08 — Redis caching
Scope:
- Cache tag suggestions and document lookups (read-through) with time-to-live (TTL):
  - Document lookups: 5 minutes
  - Tag suggestions: 10 minutes
- Invalidate cache on tag assignments and document updates.

DoD:
- Cache hit/miss visible in logs.
- No functional regressions when cache is empty.

## EPIC CA-2: Tags Module

Goal: Provide tenant-scoped tags with suggestions and assignment to documents
and other modules.

### CA-BE-09 — Tags entities (migration + entities)
Scope:
- Create `tags` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `name` string (original)
  - `name_normalized` string (lowercase, trimmed)
  - `usage_count` int default 0
  - `last_used_at` timestamptz nullable
  - audit columns + timestamps
- Create `tag_links` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `tag_id` uuid FK -> tags
  - `resource_type` string (e.g., `document`, `sales_order`)
  - `resource_id` uuid
  - timestamps
- Enforce unique constraint on `tenant_id + tag_id + resource_type + resource_id`.
- Existing `people.tags` and `items.tags` jsonb arrays must be assessed for
  migration or compatibility with `tag_links`.
- Backfill: migrate `people.tags` and `items.tags` into `tag_links` and
  update `usage_count`/`last_used_at`.

DoD:
- Migration runs successfully.
- Tags are tenant-scoped and shared across modules.

### CA-BE-10 — Tag APIs (application programming interfaces)
Scope:
- `GET /tags?query=` returns prefix matches ordered by usage_count/last_used_at.
- `POST /tags/assign` assigns tags to a resource and auto-creates missing tags.
- `DELETE /tags/assign` removes tags from a resource and updates usage_count.
- Enforce lock: tags cannot be changed once document is APPROVED/POSTED.

DoD:
- Suggestions return only tenant-scoped tags.
- Auto-create on first use works.
- Tag changes update usage metrics.

### CA-BE-11 — Tag permissions + settings
Scope:
- Add permission codes:
  - `tags.assign` (tenant-scoped)
  - `tags.manage` (super admin only)
- Add tenant-configurable tag rules:
  - `max_length`
  - `allowed_pattern`
- Add error codes for tag validation and lock rules.

DoD:
- Tags manager is gated to super admin.
- Tag assign uses `tags.assign`.
- Validation rules are enforced server-side.

### CA-FE-01 — Tags manager UI
Scope:
- Route: `/settings/tags` (super admin only).
- Manage tags list (search, rename, deactivate).
- Display usage_count and last_used_at.

DoD:
- Super admin can manage tags.
- Non-super admin blocked.

### CA-FE-02 — Tag assignment UI hook
Scope:
- Provide a tag input component with prefix suggestions.
- Integrate with document-related screens later (no module integration yet).

DoD:
- Tag input works with `GET /tags` suggestion API.

## EPIC CA-3: Documentation + Verification

### CA-DOC-01 — Documentation updates
Scope:
- Update `README.md` or `AGENTS.md` to note the new document engine + tags
  foundations and Redis/BullMQ usage.

DoD:
- Docs mention the new module and verification flow.

### CA-QA-01 — Verification additions
Scope:
- Extend `apps/api/verify.sh`:
  - Smoke test tag suggestion + assignment endpoints.
  - Create draft document, submit, approve, post, and verify outbox row.
  - Verify ledger entry rows created on post.
  - Verify migrated people/items tags appear in tag suggestions.
  - Update tenant settings to change a document prefix, then create a document
    and assert the prefix is used.
  - Set tenant default tax (Cycle 2) and verify document_tax_lines snapshots.
  - Switch active tenant and confirm documents are tenant-isolated.
  - Ensure Redis queue processes at least one event.

DoD:
- Script passes against a running API.

## Out of scope (explicit)
- Module-specific extensions (`sales_headers`, `sales_lines`, etc.) and
  full rendering templates.
- External delivery (email, public links).
- Full inventory/accounting postings and reversal logic beyond stub ledger entries.
- Multi-tenant tag analytics dashboards.

## Suggested execution order
1. CA-BE-01 -> CA-BE-05 (core docs + workflow + posting + access rules)
2. CA-BE-06 -> CA-BE-08 (outbox + worker + Redis)
3. CA-BE-09 -> CA-BE-11 (tags backend + permissions)
4. CA-FE-01 -> CA-FE-02 (tags UI)
5. CA-DOC-01 -> CA-QA-01
