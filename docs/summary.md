# Summary

## Workspace
- Monorepo with apps/api (NestJS + Fastify + TypeORM), apps/web (Next.js App Router), and packages/shared (DTOs/constants).
- Docker compose runs postgres, api, web; root scripts are pnpm dev, pnpm build, pnpm docker:up, pnpm docker:down.
- Shared package exports error codes, permissions, pagination types, theme presets, and locale enums.

## Cycle 0 - Foundation
- Health endpoint with shared HealthResponse type.
- Baseline env samples and docker compose wiring.

## Cycle 1 - Identity + Multi-tenant RBAC
- Auth flow with HttpOnly cookies (/auth/login, /auth/logout, /auth/me).
- Active tenant cookie and permission resolution (/me/tenants/active, /me/permissions).
- RBAC entities, migrations, and seed data (users, tenants, permissions, roles, role_permissions, tenant_users).
- Role and tenant-user management endpoints and guards.
- UI shell with guarded routes: login, select tenant, dashboard, settings (tenant/tenants/roles/users), profile.

## Cycle 2 - Tenant Flags + Taxes
- Tenant flags (type, isTaxable) and tenant tax mappings.
- Platform tax CRUD (super admin) with pagination and status filtering.
- Tenant tax settings API and UI (select taxes and default) under tenant settings.
- Settings sidebar includes taxes and audit logs for super admins.

## Cycle 3 - Planned (People Core + Staff User Link)
- People master data (customer/supplier/staff) with tenant-scoped codes and counters.
- Walk-in customer default per tenant.
- Staff user linking and create-user flow.

## Cycle 4 - Planned (Catalog)
- Catalog items (product/service) with SKU generation and membership/PT session support.
- Categories with 2-level tree and optional item assignment.
- Item media via MinIO and CSV/XLSX import/export.

## Implemented Addenda (post-spec)
- Audit logs: audit_logs table + subscriber, super-admin list API, audit logs UI with filters and detail dialog.
- Theme system: tenant_themes table + theme presets, tenant theme settings API, ThemeProvider + /settings/theme UI.
- Localization: tenant language enum, NextIntl provider with en/id catalogs, language selector in tenant settings.
- UTC timestamps: baseline migration now uses `timestamptz` for all audit/timestamp columns; audit log filters require timezone-aware ISO strings.

## Verification
- pnpm --filter @gym-monorepo/shared build
- pnpm --filter api test
- pnpm --filter web test
- apps/api/verify.sh (requires running API)
- pnpm dev or pnpm docker:up
