# Cycle 5 Tickets: Sales + Membership Lifecycle

## Theme
- POS sales foundation with membership entitlements and PT credits.

## Alignment with existing system (required)
- Audit columns: all new entities extend `BaseAuditEntity` so audit logs capture create/update/delete (Cycle 1/2 patterns).
- Multi-tenant scoping: all Sales/Membership endpoints filter by active tenant ID; guard order remains Auth -> ActiveTenant -> TenantMembership -> Permission.
- Error codes: use centralized error codes from `@gym-monorepo/shared`.
- i18n: all new UI strings added to `apps/web/src/locales/en.json` and `apps/web/src/locales/id.json`.
- API client: frontend uses axios `api`/`apiRaw` (no `fetch`).
- Permissions: add new `sales.*` and `memberships.*` permissions in shared constants and seed list.
- Taxes: apply tenant tax settings from Cycle 2, store tax snapshots on sales orders.

## EPIC C5-0: Sales Core (Orders + Payments)

Goal: Enable tenant-scoped sales orders with line items, taxes, and payment tracking.

### C5A-BE-01 - Sales orders + line items entities (migration)
Scope:
- Create `sales_orders` table with:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `number` string (unique per tenant)
  - `customer_id` uuid nullable FK -> people (type CUSTOMER required when selling service items)
  - `status` enum: `DRAFT | CONFIRMED | VOID`
  - `payment_status` enum: `UNPAID | PARTIAL | PAID | REFUNDED`
  - `subtotal`, `discount_total`, `tax_total`, `total` numeric(12,2)
  - `notes` text nullable
  - `sold_at` timestamptz nullable (set on confirm)
  - audit columns + timestamps
- Create `sales_order_items` table with:
  - `id` uuid PK
  - `order_id` uuid FK -> sales_orders
  - `item_id` uuid FK -> items
  - `quantity` int
  - `unit_price` numeric(12,2)
  - `discount_amount` numeric(12,2) default 0
  - `line_total` numeric(12,2)
  - snapshot fields: `item_name`, `item_type`, `service_kind`, `duration_value`, `duration_unit`,
    `session_count`, `included_pt_sessions` (nullable where not applicable)
- Constraints:
  - unique (`tenant_id`, `number`)
  - no cascade deletes from items (preserve historical snapshots)

DoD:
- Migration runs successfully.
- Entities use BaseAuditEntity and barrel imports.

### C5A-BE-02 - Sales taxes + payments entities (migration)
Scope:
- Create `sales_order_taxes` table with:
  - `id` uuid PK
  - `order_id` uuid FK -> sales_orders
  - `tax_id` uuid nullable FK -> taxes
  - snapshot fields: `tax_name`, `tax_type`, `tax_rate`, `tax_amount`, `taxable_base`
- Create `sales_order_payments` table with:
  - `id` uuid PK
  - `order_id` uuid FK -> sales_orders
  - `method` enum: `CASH | CARD | TRANSFER | EWALLET`
  - `amount` numeric(12,2)
  - `reference` string nullable
  - `status` enum: `CAPTURED | VOIDED | REFUNDED`
  - `paid_at` timestamptz
  - audit columns + timestamps

DoD:
- Migrations run successfully.
- Payment rows persist full audit trail.

### C5A-BE-03 - Sales order number generation
Scope:
- Use `tenant_counters` with key `sales.orders` and prefix `SO-`.
- Generation rules follow the same transactional counter logic as People/Departments/Catalog.

DoD:
- Unique order numbers per tenant; race-safe under concurrent writes.

### C5A-BE-04 - Sales calculation + validation rules
Scope:
- Validate all items exist, are `ACTIVE`, and satisfy Cycle 4 service rules.
- `customer_id` is required when any line item is `SERVICE`.
- Totals:
  - `line_total = (quantity * unit_price) - discount_amount`
  - `subtotal = sum(line_total)`
  - `tax_total` from tenant tax settings (default tax only for now)
  - `total = subtotal + tax_total - order_discount`
- If tenant is taxable but has no default tax, reject with `TENANT_TAX_NOT_CONFIGURED`.
- If tenant is non-taxable, `tax_total = 0` and no tax rows are created.
- No inventory adjustments in Cycle 5 (explicitly out of scope).

DoD:
- Totals are deterministic and persisted with tax snapshots.
- Invalid state returns shared error codes.

### C5A-BE-05 - Sales API endpoints (tenant-scoped)
Scope:
- Module: `apps/api/src/modules/sales`.
- Guards: AuthGuard -> ActiveTenantGuard -> TenantMembershipGuard -> PermissionGuard.
- Endpoints:
  - `GET /sales/orders?status=&paymentStatus=&customerId=&search=&from=&to=&page=&limit=`
  - `GET /sales/orders/:id`
  - `POST /sales/orders` (creates DRAFT)
  - `PUT /sales/orders/:id` (DRAFT only)
  - `POST /sales/orders/:id/confirm`
  - `POST /sales/orders/:id/void`
  - `POST /sales/orders/:id/payments`
  - `POST /sales/orders/:id/payments/:paymentId/void`
- Confirm action:
  - locks totals, sets `sold_at`, creates membership/PT credits (see C5B).
  - rejects if already CONFIRMED or VOID.
- Void action:
  - allowed only when `payment_status = UNPAID` and `status = DRAFT`.

DoD:
- Pagination and filters behave consistently.
- Guard order and permission checks enforced for all endpoints.

### C5A-BE-06 - Shared types, permissions, error codes
Scope:
- Add shared enums/types:
  - `SalesOrderStatus`, `SalesPaymentStatus`, `SalesPaymentMethod`
- Add error codes:
  - `SALES_ERRORS.NOT_FOUND`, `SALES_ERRORS.INVALID_STATUS`,
    `SALES_ERRORS.CUSTOMER_REQUIRED`, `SALES_ERRORS.ITEMS_REQUIRED`,
    `SALES_ERRORS.TENANT_TAX_NOT_CONFIGURED`
  - `PAYMENT_ERRORS.NOT_FOUND`, `PAYMENT_ERRORS.INVALID_AMOUNT`,
    `PAYMENT_ERRORS.OVERPAYMENT`
- Add permission codes (group: Sales):
  - `sales.read`, `sales.create`, `sales.update`, `sales.pay`, `sales.void`

DoD:
- New codes appear in Roles UI and are enforced by guards.

## EPIC C5-1: Membership Lifecycle (Members + PT Credits)

Goal: Create memberships and PT credit balances from sales; support check-ins and session consumption.

### C5B-BE-01 - Membership entities + migrations
Scope:
- Create `memberships` table with:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `person_id` uuid FK -> people (type CUSTOMER)
  - `code` string (unique per tenant)
  - `status` enum: `ACTIVE | EXPIRED | CANCELED | PAUSED`
  - `start_date`, `end_date` timestamptz
  - `membership_item_id` uuid FK -> items
  - `source_order_id`, `source_order_item_id` uuid FK -> sales_order_items
  - `notes` text nullable
  - audit columns + timestamps
- Create `pt_credits` table with:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `person_id` uuid FK -> people
  - `membership_id` uuid nullable FK -> memberships
  - `source_order_id`, `source_order_item_id` uuid FK -> sales_order_items
  - `total_sessions`, `remaining_sessions` int
  - `expires_at` timestamptz nullable
  - `status` enum: `ACTIVE | EXPIRED | DEPLETED`
  - audit columns + timestamps
- Create `membership_checkins` table with:
  - `id` uuid PK
  - `membership_id` uuid FK -> memberships
  - `checked_in_at` timestamptz
  - `staff_user_id` uuid nullable FK -> users
  - `notes` text nullable
  - audit columns + timestamps
- Create `pt_session_logs` table with:
  - `id` uuid PK
  - `pt_credit_id` uuid FK -> pt_credits
  - `consumed_at` timestamptz
  - `staff_user_id` uuid nullable FK -> users
  - `notes` text nullable
  - audit columns + timestamps
- Membership code uses `tenant_counters` key `memberships` with prefix `MEM-`.

DoD:
- Migrations run successfully.
- Entities use BaseAuditEntity and barrel imports.

### C5B-BE-02 - Membership + PT credit creation on sale confirm
Scope:
- On `POST /sales/orders/:id/confirm`:
  - For `SERVICE` + `service_kind=MEMBERSHIP`:
    - Create membership with `start_date = sold_at`.
    - `end_date` derived from item duration.
    - If `included_pt_sessions` present, create PT credits linked to membership.
  - For `SERVICE` + `service_kind=PT_SESSION`:
    - Create PT credits using `session_count`, `expires_at` from duration if provided.
- If customer is missing, reject confirmation with `SALES_ERRORS.CUSTOMER_REQUIRED`.

DoD:
- Membership/credit creation is transactional with order confirmation.
- Sales order cannot confirm without required customer.

### C5B-BE-03 - Membership API endpoints (tenant-scoped)
Scope:
- Module: `apps/api/src/modules/memberships`.
- Guards: AuthGuard -> ActiveTenantGuard -> TenantMembershipGuard -> PermissionGuard.
- Endpoints:
  - `GET /memberships?status=&customerId=&search=&page=&limit=`
  - `GET /memberships/:id`
  - `POST /memberships/:id/cancel`
  - `POST /memberships/:id/checkins`
  - `GET /memberships/:id/checkins`
  - `GET /pt-credits?status=&customerId=&page=&limit=`
  - `POST /pt-credits/:id/consume`
- Status auto-updates:
  - On read, if `end_date < now` and status `ACTIVE`, mark `EXPIRED`.
  - If `remaining_sessions = 0`, set `DEPLETED`.
  - If `expires_at < now`, set `EXPIRED`.

DoD:
- Check-ins only allowed for active memberships within date range.
- PT consumption only allowed for active, non-expired credits.

### C5B-BE-04 - Membership permissions + error codes
Scope:
- Add permission codes (group: Memberships):
  - `memberships.read`, `memberships.update`, `memberships.checkin`, `memberships.consume`
- Add error codes:
  - `MEMBERSHIP_ERRORS.NOT_FOUND`, `MEMBERSHIP_ERRORS.INVALID_STATUS`,
    `MEMBERSHIP_ERRORS.EXPIRED`, `MEMBERSHIP_ERRORS.CHECKIN_NOT_ALLOWED`
  - `PT_ERRORS.NOT_FOUND`, `PT_ERRORS.INVALID_STATUS`

DoD:
- Guards enforce access for membership endpoints and actions.

## EPIC C5-2: Frontend Sales UI

Goal: Deliver a POS-style sales flow and order management.

### C5C-FE-01 - Sales routes + permission guards
Scope:
- Routes:
  - `/sales` (list)
  - `/sales/new` (POS)
  - `/sales/[id]` (detail)
- Sidebar: gate Sales group by `sales.*`.
- Guard pages with `usePermissions` and block when missing access.

DoD:
- Menu and routes follow permission rules.

### C5C-FE-02 - POS flow (create + confirm + pay)
Scope:
- Item picker (search/filter) from Catalog items.
- Cart with quantity, price, discount, and totals.
- Customer selector (People type CUSTOMER) required when selling services.
- Tax summary from tenant settings (display applied default tax).
- Confirm action to create/confirm order, payment dialog for full/partial pay.
- Show server validation errors inline.

DoD:
- Create + confirm + pay flow works end-to-end.
- UI reflects validation rules for membership/PT items.

### C5C-FE-03 - Sales list + detail
Scope:
- List page with filters: status, payment status, date range, customer.
- Detail page shows order metadata, items, taxes, and payments.
- Void action available for DRAFT orders only.

DoD:
- Sales orders are searchable and auditable in the UI.

## EPIC C5-3: Frontend Membership UI

Goal: Manage active memberships and PT credits under Member Management.

### C5D-FE-01 - Members list page
Scope:
- Route: `/members`
- List customers with membership status, active membership dates, PT credits.
- Filters: status, search (name/email/phone), expiring soon.

DoD:
- Members list reflects membership data accurately.

### C5D-FE-02 - Member detail
Scope:
- Route: `/members/[id]`
- Tabs: Memberships, Check-ins, PT Credits.
- Actions:
  - Check-in for active memberships.
  - Consume PT session from active credits.
  - Cancel membership (permission-gated).

DoD:
- Membership actions respect permissions and server-side validation.

### C5D-FE-03 - i18n updates
Scope:
- Add translations for:
  - Sales UI, payment methods, statuses.
  - Membership statuses, check-in actions, PT credit consumption.

DoD:
- All new UI strings localized.

## QA / Release

### C5-QA-01 - Manual verification checklist
Scope:
- Create a DRAFT sale with product items, confirm, and pay.
- Create a membership sale:
  - Membership record created with correct end date.
  - PT credits created when included sessions exist.
- Consume a PT session and verify remaining sessions decrement.
- Check-in for an active membership, verify log entry.
- Verify tax totals align with tenant default tax settings.

DoD:
- Repeatable checklist stored in `docs/CYCLE_5.md`.

## Out of scope (deferred)
- Inventory/stock deductions and purchasing flows.
- Refund workflows beyond voiding DRAFT orders.
- Scheduling/class bookings.
- Accounting journals.

## Suggested execution order (fastest, least blocked)
1. C5A-BE-01 -> C5A-BE-04 (Sales entities + rules)
2. C5A-BE-05 -> C5A-BE-06 (Sales API + shared updates)
3. C5B-BE-01 -> C5B-BE-04 (Membership backend)
4. C5C-FE-01 -> C5C-FE-03 (Sales UI)
5. C5D-FE-01 -> C5D-FE-03 (Membership UI)
6. C5-QA-01
