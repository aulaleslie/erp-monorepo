# Cycle 5 Tickets: Sales (Orders + Invoices + Credit Notes + Approvals)

## Theme
- Deliver a Sales module on top of the document engine with sales-specific approvals, order -> invoice flow, and PDF outputs stored in MinIO.

## Alignment with existing system (required)
- **Audit columns:** all new entities extend `BaseAuditEntity` so audit logs capture create/update/delete (Cycle 1/2 pattern).
- **Guards:** Auth -> ActiveTenant -> TenantMembership -> Permission (Cycle 1 guard order).
- **Error codes:** use centralized error codes from `@gym-monorepo/shared` for new exceptions.
- **i18n:** new UI strings split by feature in `apps/web/src/locales/` (aggregated from leaf-route folders).
- **API client:** frontend uses axios `api`/`apiRaw` (no `fetch`).
- **Permissions:** add new Sales permission constants and seed them.
- **Document engine:** reuse `documents`, `document_items`, `document_status_history`, `document_number_settings`.
- **Tags:** use tags module with resourceType `sales.documents`; extend tag lock rule to match APPROVED/POSTED.
- **Storage:** MinIO used for PDFs and attachments; StorageService remains image-only, so Sales uses a dedicated validation path for non-image attachments.

## EPIC C5-0: Sales Documents (Core)

Goal: Implement Sales Order, Sales Invoice, and Sales Credit Note using the document engine.

### C5A-BE-01 - Sales document types + shared constants
Scope:
- Add `sales.credit_note` to document type registry (`packages/shared/src/constants/document.ts`).
- Add new Sales enums/types to shared:
  - `SalesDocumentType` (ORDER, INVOICE, CREDIT_NOTE)
  - `SalesTaxPricingMode` (INCLUSIVE, EXCLUSIVE)
- Add Sales error codes (e.g., `SALES_ERRORS.NOT_FOUND`, `SALES_ERRORS.INVALID_STATUS`, `SALES_ERRORS.INVALID_PERSON`, `SALES_ERRORS.MISSING_APPROVAL_CONFIG`, `SALES_ERRORS.INVALID_TAX_MODE`).
- Add Sales permissions to shared constants.

DoD:
- Shared package builds and exports new constants/types.
- New error codes used in Sales module exceptions.

### C5A-BE-02 - Sales headers + migration
Scope:
- Create `sales_headers` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_id` uuid FK -> documents (1:1)
  - `salesperson_person_id` uuid FK -> people (must be STAFF)
  - `external_ref` string nullable
  - `payment_terms` string nullable
  - `delivery_date` timestamptz nullable (required for orders)
  - `tax_pricing_mode` enum: INCLUSIVE | EXCLUSIVE (required)
  - `billing_address_snapshot` text nullable
  - `shipping_address_snapshot` text nullable
  - audit columns + timestamps
- `personId` on document is required and must be `People.type = CUSTOMER` and `status=ACTIVE`.
- Do not auto-select “Walk in” customer on create.

DoD:
- Migration runs successfully.
- Headers are created/updated for all Sales docs.

### C5A-BE-03 - Document relations
Scope:
- Create `document_relations` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `from_document_id` uuid FK -> documents
  - `to_document_id` uuid FK -> documents
  - `relation_type` enum: `ORDER_TO_INVOICE`, `INVOICE_TO_CREDIT`
  - audit columns + timestamps
- Allow multiple invoices linked to the same order (split billing).

DoD:
- Relation table supports order->invoice and invoice->credit note.

### C5A-BE-04 - Sales Orders API
Scope:
- Module path: `apps/api/src/modules/sales/orders`.
- Endpoints:
  - `GET /sales/orders?status=&dateFrom=&dateTo=&personId=&number=&search=&tag=&page=&limit=`
  - `GET /sales/orders/:id`
  - `POST /sales/orders`
  - `PUT /sales/orders/:id` (DRAFT only)
  - `POST /sales/orders/:id/submit`
  - `POST /sales/orders/:id/approve`
  - `POST /sales/orders/:id/reject`
  - `POST /sales/orders/:id/request-revision`
  - `POST /sales/orders/:id/cancel`
- Required data:
  - `document_date`
  - `delivery_date` (required)
  - `person_id` (CUSTOMER, ACTIVE)
  - Items from catalog only (no ad-hoc items)
- Pricing:
  - Unit price editable
  - Line + header discount supported
  - Discount percent stored in metadata
  - Zero-price items allowed
  - Tax pricing mode per header, default INCLUSIVE; INCLUSIVE means unitPrice includes tax
  - Round per line then sum
- Cancellation only in DRAFT/SUBMITTED.
- On APPROVE: auto-create invoice in SUBMITTED state (full amount) and create document_relations entry.

DoD:
- All endpoints enforce permissions and validation.
- Auto-convert produces invoice in SUBMITTED and links it.

### C5A-BE-05 - Sales Invoices API
Scope:
- Module path: `apps/api/src/modules/sales/invoices`.
- Endpoints:
  - `GET /sales/invoices?status=&dateFrom=&dateTo=&personId=&number=&search=&tag=&page=&limit=`
  - `GET /sales/invoices/:id`
  - `POST /sales/invoices`
  - `PUT /sales/invoices/:id` (DRAFT only)
  - `POST /sales/invoices/:id/submit`
  - `POST /sales/invoices/:id/approve`
  - `POST /sales/invoices/:id/reject`
  - `POST /sales/invoices/:id/request-revision`
  - `POST /sales/invoices/:id/cancel`
  - `POST /sales/invoices/:id/post` (invoice-only)
- Invoice `dueDate` is required.
- Posting allowed for invoices only; no accounting lines yet; status transitions and outbox events still recorded.
- Cancellation only in DRAFT/SUBMITTED.

DoD:
- Invoice lifecycle works end-to-end with status history.

### C5A-BE-06 - Sales Credit Notes
Scope:
- Document type: `sales.credit_note`.
- API:
  - `POST /sales/invoices/:id/credit-notes` (create credit note linked to invoice)
  - `GET /sales/credit-notes?status=&dateFrom=&dateTo=&personId=&number=&search=&tag=&page=&limit=`
  - `GET /sales/credit-notes/:id`
  - `POST /sales/credit-notes/:id/submit|approve|reject|request-revision|cancel|post`
- Credit note can only reference a POSTED invoice.
- Use `document_relations` with relation type `INVOICE_TO_CREDIT`.
- Cancel after POSTED is disallowed; use credit note as reversal.

DoD:
- Credit notes link to invoices and use the same approval flow.

### C5A-BE-07 - Tags for Sales documents
Scope:
- Use tag resourceType `sales.documents` for orders/invoices/credit notes.
- Extend tag locking rule to include `sales.documents` when status is APPROVED or POSTED.
- Support tag search filter in list endpoints.

DoD:
- Tags are editable always, regardless of document status.

### C5A-BE-08 - Sales attachments
Scope:
- Create `sales_attachments` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_id` uuid FK -> documents
  - `file_name`, `mime_type`, `size`, `storage_key`, `public_url`
  - audit columns + timestamps
- Max attachments per doc: 5
- Allowed types: images, PDF, office docs (DOC/DOCX/XLS/XLSX/PPT/PPTX)
- Max size per attachment: 1MB
- Use a Sales-specific validation path for non-image attachments (StorageService remains image-only).
- Endpoints:
  - `POST /sales/documents/:id/attachments` (multipart)
  - `DELETE /sales/documents/:id/attachments/:attachmentId`
  - `GET /sales/documents/:id/attachments`

DoD:
- Upload/store/delete works and respects limits.

### C5A-BE-09 - Sales PDF generation
Scope:
- Generate server-side PDF for orders/invoices/credit notes.
- Store PDF in MinIO and return URL.
- Endpoint: `POST /sales/documents/:id/pdf` (or `GET` if already generated).

DoD:
- PDF is generated and stored; detail pages can download it.

### C5A-BE-10 - Numbering settings defaults
Scope:
- Seed `document_number_settings` for:
  - `sales.order` prefix `SO-`
  - `sales.invoice` prefix `INV-`
  - `sales.credit_note` prefix `CN-`
- `include_period = true` by default (`yyyy-MM`).
- Tenant configurable via existing settings.

DoD:
- Defaults exist for new tenants; configurable per tenant.

## EPIC C5-1: Sales Approvals (Sales-specific levels)

Goal: Replace document-level approvals for Sales with sales-specific approval levels.

### C5B-BE-01 - Sales approval entities + migration
Scope:
- Add `sales_approval_levels` table:
  - `id` uuid PK
  - `tenant_id` uuid FK -> tenants
  - `document_key` (sales.order | sales.invoice | sales.credit_note)
  - `level_index` int
  - `is_active` boolean
  - audit columns + timestamps
- Add `sales_approval_level_roles` join table:
  - `id` uuid PK
  - `sales_approval_level_id` uuid FK
  - `role_id` uuid FK -> roles
- Add `sales_approvals` table:
  - `id` uuid PK
  - `document_id` uuid FK -> documents
  - `level_index` int
  - `status` enum: PENDING | APPROVED | REJECTED | REVISION_REQUESTED
  - `requested_by_user_id`, `decided_by_user_id`, `decided_at`, `notes`
  - audit columns + timestamps

DoD:
- Migrations run and entities registered.

### C5B-BE-02 - Sales approval flow
Scope:
- Approvals start at SUBMITTED.
- Sequential approval by level; any one approver per level.
- Creator can approve if they have `sales.approve`.
- If no approval config, block submit with `SALES_ERRORS.MISSING_APPROVAL_CONFIG`.
- After REVISION_REQUESTED and edits, approvals reset to level 1.
- Record transitions in `document_status_history`.
- Also write to `document_approvals` for compatibility (sales only).

DoD:
- Approval flow enforced for orders/invoices/credit notes.

### C5B-BE-03 - Sales approval config API
Scope:
- `GET /sales/approvals/config?documentKey=`
- `PUT /sales/approvals/config` to set levels + roles
- Permissions: `sales.approve` + `sales.update` (or admin-level role)

DoD:
- Config CRUD works with role selection.

## EPIC C5-2: Sales UI

Goal: Provide UI for sales docs, approvals, and PDF download.

### C5C-FE-01 - Sales routes + sidebar
Scope:
- Routes:
  - `/sales/orders`, `/sales/orders/new`, `/sales/orders/[id]`, `/sales/orders/[id]/edit`
  - `/sales/invoices`, `/sales/invoices/new`, `/sales/invoices/[id]`, `/sales/invoices/[id]/edit`
  - `/sales/credit-notes`, `/sales/credit-notes/[id]`
  - `/sales/orders/approvals`, `/sales/invoices/approvals`
  - `/sales/approvals/config`
- Sidebar: update Sales group to include Orders, Invoices, Credit Notes, Approvals.

DoD:
- Menu visibility respects permissions.

### C5C-FE-02 - Orders list + form + detail
Scope:
- List filters: status, date range, customer, number, search, tags.
- Form: deliveryDate required; person required; items from catalog only; pricing editable.
- Status transitions via explicit actions (submit/approve/reject/revision/cancel).
- Detail shows status history, related invoices, and attachments.

DoD:
- Orders flow works end-to-end.

### C5C-FE-03 - Invoices list + form + detail
Scope:
- List filters same as orders.
- Form: dueDate required.
- Detail shows status, related order/credit notes, attachments, PDF download.

DoD:
- Invoices flow works end-to-end.

### C5C-FE-04 - Credit notes UI
Scope:
- Create credit note from invoice detail.
- Credit note list + detail with status actions.

DoD:
- Credit notes are linked and visible.

### C5C-FE-05 - Approvals UI
Scope:
- Approval queue pages for orders and invoices.
- Config UI for approval levels per document type.
- In-app notifications (badge + queue list).

DoD:
- Approvers can act on pending approvals and configure levels.

### C5C-FE-06 - PDF + attachments UI
Scope:
- PDF generation button on detail pages (fetches URL, downloads).
- Attachments component: upload, list, delete.

DoD:
- PDFs and attachments work end-to-end.

## EPIC C5-3: Permissions + Seeds

### C5D-BE-01 - Permissions
Scope:
- Hybrid permissions:
  - `sales.read`, `sales.create`, `sales.update`, `sales.delete`
  - `sales.submit`, `sales.approve`, `sales.cancel`
  - `sales.orders.convert`
  - `sales.invoices.post`
- Seed permissions group label `Sales`.

DoD:
- Permissions available in Roles UI and enforced by guards.

## Seed + Verification
- No seed sales documents.
- No changes to `apps/api/verify.sh`.

## Suggested execution order
1) C5A-BE-01 -> C5A-BE-02 -> C5A-BE-03
2) C5B-BE-01 -> C5B-BE-02 -> C5B-BE-03
3) C5A-BE-04 -> C5A-BE-06 -> C5A-BE-07 -> C5A-BE-09
4) C5C-FE-01 -> C5C-FE-06
5) C5D-BE-01
