# Locale Refactor Plan (per-menu folders)

## Purpose
Move the locale catalog from two large JSON files into per-menu folders and rename namespaces to a feature+page scheme so translations are easier to find, edit, and review with a clear ownership model.

## Current state (summary)
- `apps/web/src/locales/en.json` and `apps/web/src/locales/id.json` hold all strings.
- `LocaleProvider` imports those JSON files and passes them to `NextIntlClientProvider`.
- UI components call `useTranslations()` with namespaces (e.g., `sales.orders`, `sidebar`, `people`).

## Target structure (menu-first, leaf-route folders)
```
apps/web/src/locales/
  common/
    en.json
    id.json
  layout/
    en.json
    id.json
  sidebar/
    en.json
    id.json
  auth/
    en.json
    id.json
  profile/
    en.json
    id.json
  select-tenant/
    en.json
    id.json
  dashboard/
    en.json
    id.json
  member-management/
    members/
      en.json
      id.json
    scheduling/
      en.json
      id.json
  catalog/
    items/
      en.json
      id.json
    categories/
      en.json
      id.json
  sales/
    orders/
      en.json
      id.json
    invoices/
      en.json
      id.json
    credit-notes/
      en.json
      id.json
    approvals/
      orders/
        en.json
        id.json
      invoices/
        en.json
        id.json
      config/
        en.json
        id.json
  organization/
    people/
      en.json
      id.json
    departments/
      en.json
      id.json
  inventory/
    en.json
    id.json
  purchase/
    en.json
    id.json
  settings/
    users/
      en.json
      id.json
    roles/
      en.json
      id.json
    tags/
      en.json
      id.json
    audit-logs/
      en.json
      id.json
    taxes/
      en.json
      id.json
    tenants/
      en.json
      id.json
    tenant/
      en.json
      id.json
    theme/
      en.json
      id.json
  locales.ts (new aggregate)
```

Notes:
- Folder names map to **leaf routes** (per decision).
- Each file exports a **partial messages tree** using the **feature+page** namespace scheme (e.g., `catalog.items.list`, `catalog.items.form`), merged by `locales.ts`.
- Keep a **small shared core** only (`common`, `sidebar`, `layout.navbar`, `auth.guard`) and move everything else into feature folders.

## Implementation plan (phased)
1. **Inventory namespaces**
   - Extract all `useTranslations("...")` namespaces from `apps/web/src` and compare to top-level keys in `en.json`/`id.json`.
   - Produce a mapping from namespace -> target folder.

2. **Define namespace map (old -> new)**
   - Draft the canonical namespace map table (see below) for the two-step migration.
   - Lock the feature+page naming convention and shared-core boundaries.

3. **Create leaf-route folders**
   - Split `en.json`/`id.json` into per-route files based on the namespace map.
   - Place shared-core strings only in `common/`, `sidebar/`, and `layout/`.

4. **Add aggregate loader**
   - Create `apps/web/src/locales/locales.ts` (or `messages.ts`) that imports each per-menu file and merges into a single messages object per locale.
   - Use a deep-merge helper so partial trees can safely combine.

5. **Two-step namespace migration**
   - Phase 1: add new namespaces alongside old ones; update `useTranslations()` calls incrementally.
   - Phase 2: remove legacy namespaces once all call sites and tests are updated.

6. **Update LocaleProvider**
   - Replace direct `en.json`/`id.json` imports with the aggregated messages export.
   - Keep `LocaleProvider` API unchanged so all components continue using `useTranslations()`.

7. **Key parity checks (required)**
   - Update `apps/web/scripts/check-translations.mjs` to scan folders + merge JSON.
   - Fail on missing keys **and** empty strings; keep it in `pnpm --filter web lint`.

8. **Doc updates**
   - Update the relevant cycle doc or summary entry that currently references `en.json`/`id.json` to mention per-menu folders.

## Migration strategy
- **Two-step migration**: introduce new namespaces while keeping old ones, then remove legacy keys after all call sites are updated.
- If needed, migrate one route folder at a time, keeping the aggregator compatible with both old and new trees during Phase 1.

## Risks & mitigations
- **Namespace collisions**: avoid duplicate top-level keys across files; if unavoidable, use a deep merge and document ownership.
- **Missing keys**: key parity check between `en` and `id` prevents runtime fallbacks.
- **Future additions**: document the folder mapping so new strings go to the right file.

## Decisions (based on your answers)
- Folder granularity: **Leaf route folders** (sales/orders, sales/invoices, etc.).
- Namespace stability: **Rename namespaces** for clearer ownership.
- Namespace rename scheme: **Feature + page** (e.g., `catalog.items.list`, `catalog.items.form`).
- Layout choice: **Menu-first** folders (e.g., `locales/sales/en.json`).
- Parity tooling: **Scan folders + merge JSON** in `check-translations.mjs`.
- Parity script strictness: **Fail on empty strings** (not just warn).
- Shared strings policy: **Small shared core** (e.g., `common.buttons`, `common.status`) with everything else in feature folders.
- Sidebar labels: **Keep `sidebar.*` centralized**.
- Migration sequencing: **Two-step migration** (introduce new namespaces, then remove old ones).
- Locale selection: **Tenant-config driven** via `activeTenant.language` (unchanged behavior).
- Loader strategy: **Single aggregated messages object per locale**.
- Namespace map table: **Yes** (draft below).

## Namespace map (draft, top-level -> new prefixes)
| Old namespace | New namespace prefix (feature+page) | Target folder | Notes |
| --- | --- | --- | --- |
| common | common.* | common/ | Shared core only (buttons, status, validation, etc.). |
| sidebar | sidebar.* | sidebar/ | Centralized sidebar labels. |
| navbar | layout.navbar.* | layout/ | Layout/global navigation strings. |
| authGuard | auth.guard.* | auth/ | Auth guard loading/empty state text. |
| selectTenant | selectTenant.page.* | select-tenant/ | Select-tenant page copy. |
| dashboard | dashboard.page.* | dashboard/ | Single dashboard page. |
| memberManagement | memberManagement.members.page.*, memberManagement.scheduling.page.* | member-management/members/, member-management/scheduling/ | Split by leaf routes. |
| inventory | inventory.page.* | inventory/ | Inventory placeholder/coming soon. |
| purchase | purchase.page.* | purchase/ | Purchase placeholder/coming soon. |
| sales | sales.orders.*, sales.invoices.*, sales.creditNotes.*, sales.approvals.* | sales/orders/, sales/invoices/, sales/credit-notes/, sales/approvals/ | Split orders/invoices/credit-notes/approvals; move shared labels into common if reused. |
| people | organization.people.* | organization/people/ | List/form/detail/alerts. |
| departments | organization.departments.* | organization/departments/ | List/form/detail. |
| items | catalog.items.* | catalog/items/ | List/form/detail/import/export. |
| categories | catalog.categories.* | catalog/categories/ | List/form/detail. |
| roles | settings.roles.* | settings/roles/ | List/create/edit. |
| users | settings.users.* | settings/users/ | List/create/edit/invite. |
| tenants | settings.tenants.* | settings/tenants/ | List/create/edit. |
| tenant | settings.tenant.* | settings/tenant/ | Tenant settings page. |
| taxes | settings.taxes.* | settings/taxes/ | List/form. |
| auditLogs | settings.auditLogs.* | settings/audit-logs/ | List/detail/filter. |
| tags | settings.tags.* | settings/tags/ | List/form. |
| profile | profile.page.* | profile/ | Profile page + dialogs. |
| labels | settings.tenant.*, settings.tenants.* (split) | settings/tenant/, settings/tenants/ | Split by owner page during migration. |
