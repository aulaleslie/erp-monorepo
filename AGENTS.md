# AGENTS

## Why this file exists
Future agents have to deliver work that feels like a natural continuation of the `gym-erp` monorepo. Before starting any change, read this document so you understand the locked decisions, preferred libraries, and verification steps already in use.

## Primary references
- `docs/CYCLE_0.md` (locked decisions, pnpm setup, Docker-compose baseline, shared DTO expectations).
- `docs/CYCLE_1.md` (Cycle 1 domain model, migrations order, seed data, authentication and permission endpoints).
- `docs/CYCLE_2.md` (tenant flags, platform taxes, tenant tax settings, and related permissions/guards).
- `docs/CYCLE_3.md` (people master data, staff user linking, and related permissions/endpoints).
- `docs/CYCLE_ALTER.md` (document engine, tags module, outbox, Redis/BullMQ worker foundation).
- `docs/summary.md` (current implementation map across cycles and addenda).
- UI migration guidance now lives in Cycle 1/2 (Tailwind + shadcn UI guide, app shell expectations, menu permissions, component list, and cycle-1 page targets).

Always cite the relevant section of these docs when you describe your plan or justify an implementation in your response.

## Repo structure and packages
- `apps/api`: NestJS (Fastify) backend with TypeORM, migrations + seeds, `apps/api/verify.sh` script for smoke checking the auth flow, and Jest tests.
- `apps/web`: Next.js App Router frontend using Tailwind, shadcn/ui components, Vitest tests, and contexts/hooks under `src/contexts` + `src/hooks`.
- `packages/shared`: shared DTOs/types consumed by both apps (build via `pnpm --filter @gym-monorepo/shared build` after changes).
- Root scripts (`pnpm dev`, `pnpm build`, `pnpm docker:up`, `pnpm docker:down`) orchestrate the workspace-wide flow.

## Shared package structure (`packages/shared`)
The shared package exports common types, constants, and utilities:
- `constants/error-codes.ts` — Centralized error codes (`AUTH_ERRORS`, `TENANT_ERRORS`, `USER_ERRORS`, `ROLE_ERRORS`, `TAX_ERRORS`, `VALIDATION_ERRORS`, `DOCUMENT_ERRORS`, `TAG_ERRORS`)
- `constants/permissions.ts` — Permission code constants (`PERMISSIONS.ROLES.READ`, `PERMISSIONS.DOCUMENTS.*`, `PERMISSIONS.TAGS.*`, etc.)
- `constants/document-types.ts` — Document type registry keys (`sales.order`, `sales.invoice`, `purchasing.po`, etc.)
- `types/pagination.ts` — `PaginatedResponse<T>`, `PaginationParams`, `PAGINATION_DEFAULTS`
- Root exports for `BaseResponse`, `TenantType`, `AuditLog`, `DocumentStatus`, `ApprovalStatus`, etc.

**Always rebuild after edits:** `pnpm --filter @gym-monorepo/shared build`

## Development workflow
1. Use pnpm commands from the root unless a package-specific script is required (e.g., `pnpm --filter web dev` or `pnpm --filter api test`).
2. Keep the workspace in sync with `pnpm install` after dependency edits and commit the updated `pnpm-lock.yaml`.
3. Behind the scenes, `apps/api` uses `typeorm-datasource.ts` for CLI migrations and seed logic; never enable `synchronize: true`.
4. When editing frontend UI, make sure Tailwind is configured (`apps/web/tailwind.config.ts`, `apps/web/app/globals.css` with the `@tailwind` directives). The `cn()` helper in `apps/web/src/lib/utils.ts` should be used whenever class merging is needed.
5. Frontend components that use hooks/state must include the `use client` directive, follow the shadcn + Tailwind conventions (shadcn components live in `apps/web/components/ui`), and keep layout concerns inside the `/app` directory.
6. Git commits trigger lint-staged via Husky pre-commit hooks. Staged files in `apps/api/src` and `apps/web/src` are linted automatically.

## Testing & verification
- **Mandatory on every change:** run `pnpm --filter api lint`, `pnpm --filter web lint`, `pnpm --filter api test`, and `pnpm --filter web test`. Fix all lint errors/warnings and test failures before handoff unless the user explicitly approves skipping.
- Run `pnpm --filter web test` (or `pnpm --filter web test:run` for CI) to cover the client code.
- Run `pnpm --filter api test` for Jest coverage.
- After backend changes, execute `apps/api/verify.sh` against a running instance to ensure the auth cookie flows still work.
- `pnpm --filter @gym-monorepo/shared build` keeps the shared package consumable by both apps.
- For Docker workflows, `pnpm docker:up`/`docker:down` should bring up the Postgres + Nest + Next stack described in `docs/CYCLE_0.md`.

## API documentation
- **Swagger/OpenAPI** is available at `/api/docs` when the API is running.
- All controllers use `@ApiTags()` decorators for grouping and `@ApiCookieAuth()` for authentication.
- Tags: `auth`, `users`, `tenants`, `roles`, `taxes`, `platform`, `documents`, `tags`.

## Document Engine + Tags (Cycle ALTER)
The document engine provides a reusable foundation for transactional documents across modules (sales, purchase, accounting, inventory).

### Document workflow
- Status machine: `DRAFT → SUBMITTED → APPROVED → POSTED` (terminal), with `CANCELLED`, `REJECTED`, and `REVISION_REQUESTED` branches.
- Multi-step approvals tracked in `document_approvals` table.
- Status history recorded in `document_status_history` table.
- Posted documents require reversal documents (no cancel after POSTED).

### Document numbering
- Configurable per document type via `document_number_settings` table.
- Format: `{prefix}-{yyyy}-{mm}-{counter}` when `include_period` is true.
- Counters managed via `tenant_counters` for uniqueness per tenant + document_key.

### Outbox + Redis/BullMQ
- Document lifecycle events persisted in `document_outbox` table.
- BullMQ worker (`doc-engine` queue) processes outbox items with exponential backoff.
- Redis caching with TTL: document lookups (5 min), tag suggestions (10 min).

### Tags module
- Tenant-scoped tags with `tags` and `tag_links` tables.
- `GET /tags?query=` returns prefix-matched suggestions ordered by usage.
- `POST /tags/assign` and `DELETE /tags/assign` for resource tagging.
- Tags locked on APPROVED/POSTED documents.

## Code standards

### Entity naming
- All TypeORM entities use the `Entity` suffix: `UserEntity`, `TenantEntity`, `TaxEntity`, etc.
- Import entities from the barrel: `import { UserEntity, TenantEntity } from '../../database/entities';`

### Error handling
- **Use centralized error codes** from `@gym-monorepo/shared` for all thrown exceptions:
  ```typescript
  import { USER_ERRORS, ROLE_ERRORS } from '@gym-monorepo/shared';
  throw new NotFoundException(USER_ERRORS.NOT_FOUND.message);
  ```
- Error codes live in `packages/shared/src/constants/error-codes.ts` — add new codes there when introducing new error scenarios.

### API client (frontend)
- **Use axios exclusively** via the configured `api` instance from `@/lib/api`.
- For auth context (where manual response handling is needed), use `apiRaw` which doesn't unwrap responses.
- Never use native `fetch()` in the frontend — axios handles credentials, interceptors, and error redirects.
- Helper functions `getApiErrorMessage()` and `getApiFieldErrors()` are available for error handling.

### Shared types
- **Pagination types** (`PaginatedResponse`, `PAGINATION_DEFAULTS`) are defined in `packages/shared` and re-exported by both apps.
- Backend uses helper functions `paginate()` and `calculateSkip()` from `apps/api/src/common/dto/pagination.dto.ts`.
- Frontend imports types via `@/services/types` which re-exports from shared.

### Entity barrel exports
- Backend entities have a barrel export at `apps/api/src/database/entities/index.ts`.
- Prefer importing from the barrel: `import { UserEntity, TenantEntity } from '../../database/entities';`

## Key conventions
- Auth/permission hooks (`useAuth`, `useMe`, `usePermissions`, `useActiveTenant`) should live in `apps/web/src/contexts` or `src/hooks`, expose `can()`/`canAny()` helpers, and be the single source for guarding UI and sidebar routes.
- Sidebar/menu configuration and permission checks should be centralized in one file so toggling items is simple (per `docs/CYCLE_1.md: section 9.5`).
- Entities, migrations, and seeds must follow the Cycle 1 schema order (`users`, `tenants`, `permissions`, `roles`, `role_permissions`, `tenant_users`) with enforced foreign keys; always add migrations via the TypeORM CLI rather than manual SQL.
- JWTs for auth stay in HttpOnly cookies, tenant selection/state is stored via `active_tenant` cookie as described in `docs/CYCLE_1.md`.
- Document engine entities extend `BaseAuditEntity` and use the document type registry for validation (per `docs/CYCLE_ALTER.md`).
- Tag assignments are tenant-scoped; tag changes are blocked once a document reaches APPROVED or POSTED status.
- PRs should reference the relevant docs section numbers when possible and confirm that `pnpm lint`, `pnpm --filter web test`, and `pnpm --filter api test` pass unless explained.

## Agent behavior
1. Start with the Cycle docs above before writing a single line of code. If a request references a future feature not yet captured in the docs, ask for clarification and update the docs before implementing.
2. When you modify files, explain what changed, why, and which doc section or script guided your decision.
3. Suggest follow-up steps (test, build, docker) when handing off work. If you can't run a required lint/test command because of environment limits, state it explicitly and wait for user approval to proceed.
4. Keep context short: summarize large files instead of pasting them; load only the docs or source files needed for the task at hand.

## Maintain this file
Update `AGENTS.md` whenever the repo adds a new cycle, major architectural shift, or verification script so future agents stay aligned with the latest patterns.
