# 🔒 Locked decisions (Cycle 0)
- **Package manager:** pnpm
- **Monorepo:** single repo (Next.js + NestJS)
- **Backend:** NestJS + Fastify
- **Frontend:** Next.js
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Migrations:** enabled from day one
- **Auth:** email + password (local)
- **Tenant UX:** tenant dropdown after login
- **Node:** 22.x (v22.14.0 OK)
- **Dev workflow:** FE + BE run separately, DB via Docker
- **Prod-like workflow:** `docker compose up` runs everything

# 🚀 Cycle 0 — foundation skeleton

## 0.1 Monorepo structure (MANDATORY)
```
repo/
├─ apps/
│  ├─ api/              # NestJS (Fastify)
│  └─ web/              # Next.js
├─ packages/
│  └─ shared/           # DTOs, types, constants
├─ docker-compose.yml
├─ pnpm-workspace.yaml
├─ package.json
├─ README.md
```

## 0.2 pnpm workspace
```
pnpm-workspace.yaml

packages:
  - apps/*
  - packages/*
```

## 0.3 Root `package.json` (minimum)
```
{
  "name": "gym-erp",
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "docker:up": "docker compose up --build",
    "docker:down": "docker compose down -v"
  }
}
```

## 0.4 Backend — NestJS + Fastify
**Required features**
- Fastify adapter
- Health endpoint
- TypeORM connection configured from environment variables
- Migrations enabled, `synchronize` must stay `false`

**Health endpoint**
- `GET /health`
- Response: `{ "status": "ok" }`

**Environment sample (`apps/api/.env.example`)**
```
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gym_erp
DB_SSL=false
```

**TypeORM rules (IMPORTANT)**
- `synchronize: false`
- `migrationsRun: false`
- CLI-driven migrations
- Default naming strategy for now

## 0.5 Frontend — Next.js
**Requirements**
- Home page renders (no business logic yet)
- Fetches `/health` from the API and displays the status

**Environment sample (`apps/web/.env.example`)**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 0.6 Shared package (`packages/shared`)
Purpose:
- shared DTOs, enums, and API response types
- proves workspace wiring works when consumed by both apps

For Cycle 0 include:
```
export type HealthResponse = {
  status: string;
};
```

Consume this type in:
- Nest controller
- Next.js fetch handler

## 0.7 Docker Compose (PROD-LIKE)
Services:
1. **postgres**
   - image: `postgres:16`
   - persistent volume
   - env: `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=gym_erp`

2. **api**
   - built via `apps/api/Dockerfile`
   - `DB_HOST=postgres`
   - exposes port `3001`

3. **web**
   - built via `apps/web/Dockerfile`
   - `NEXT_PUBLIC_API_BASE_URL=http://api:3001`
   - exposes port `3000`

> ⚠️ Important
- Dev uses `localhost`, Docker uses service names
- Do not reuse dev env values blindly inside Docker

## 0.8 Dockerfiles (rules)
- Base image: `node:22-alpine`
- Multi-stage build
- Prefer non-root user (nice-to-have for portfolio)
- Final stage must exclude dev dependencies

## 0.9 Definition of Done (DO NOT MOVE ON until all true)
- `pnpm dev` (FE on `localhost:3000`, BE on `localhost:3001`, health endpoint works)
- `docker compose up --build` (apps run inside containers, DB connection succeeds)
- `.env.example` committed, `.env` excluded
