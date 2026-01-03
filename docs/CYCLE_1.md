# Cycle 1 — code-level spec

## Theme
- Identity · Multi-tenant · RBAC (No registration)

## 1 Backend — data layer (TypeORM)
### 1.1 Entities
Each entity belongs to the corresponding table and enforces the schema listed below.

**UserEntity**
```
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'DISABLED'],
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'DISABLED';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**TenantEntity**
```
@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'DISABLED'],
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'DISABLED';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**PermissionEntity (global)**
```
@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g. roles.read

  @Column()
  name: string;

  @Column()
  group: string; // Settings, Users, Platform
}
```

**RoleEntity (tenant-scoped)**
```
@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column()
  name: string;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**RolePermissionEntity**
```
@Entity('role_permissions')
@Unique(['roleId', 'permissionId'])
export class RolePermissionEntity {
  @Column()
  roleId: string;

  @Column()
  permissionId: string;
}
```

**TenantUserEntity**
```
@Entity('tenant_users')
@Unique(['tenantId', 'userId'])
export class TenantUserEntity {
  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @Column()
  roleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

## 2 Migrations (order matters)
- users
- tenants
- permissions
- roles
- role_permissions
- tenant_users

All foreign keys must be enforced and `synchronize: true` is not allowed.

## 3 Seed script (mandatory)
- Seed once per environment.
- Permissions to seed: `roles.read`, `roles.create`, `roles.update`, `roles.delete`, `users.read`, `users.create`, `users.update`, `users.assignRole`, `users.delete`, `tenants.create`, `settings.tenant.read`, `settings.tenant.update`.
- Tenants to seed: Gym, Cafeteria.
- Create one Super Admin user (`isSuperAdmin = true`) and a Super Admin role per tenant (`isSuperAdmin = true`).
- Assign the Super Admin user to both tenants so the system is demo-ready without registration.
- Only Super Admins can create new tenants or create/promote Super Admin users; keep `tenants.create` for future delegation but enforce SuperAdminGuard on creation.
- Assign `settings.tenant.read`/`settings.tenant.update` to the Super Admin role and any default admin role you want to allow for tenant profile editing.
- Permission seed lists live under `apps/api/src/scripts/seeds/permissions` so new features can add their own permission sets without editing the main seed script.

## 3.1 User + tenant management rules
- Users are global with a unique `email`; never create duplicates.
- Roles and user lists are tenant-scoped via `tenant_users`.
- When adding a tenant user:
  - If `userId` is provided, attach that user to the tenant.
  - If `email` is provided and exists, attach the existing user.
  - If `email` does not exist, create a new user and attach.
- Only Super Admins can create or promote Super Admin users/roles.

## 4 Authentication
- JWT stored in an HttpOnly `access_token` cookie.
- No refresh token this cycle.

**Endpoints**
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

**/auth/me response**
```
{
  "id": "uuid",
  "email": "admin@gym.com",
  "fullName": "Admin",
  "isSuperAdmin": true
}
```

## 5 Active tenant (cookie)
- `GET /tenants/my`
- `POST /tenants/active`
- `GET /tenants/active`
- Cookie: `active_tenant=<tenant_uuid>`
- Super Admins can set the active tenant for any tenant, even without a membership, to manage tenant-scoped settings when needed.

## 6 Permission resolution endpoint (critical)
- `GET /me/permissions` returns tenant-scoped permissions.
- Response sample:
```
{
  "superAdmin": false,
  "permissions": [
    "roles.read",
    "users.read"
  ]
}
```
- If `user.isSuperAdmin === true`, respond with `{ "superAdmin": true }`.
- UI relies on this for guards and rendering.

## 7 Backend guards (required from day one)
**Order (non-negotiable):**
1. AuthGuard
2. ActiveTenantGuard
3. TenantMembershipGuard
4. PermissionGuard

**Permission decorator example**
```
@RequirePermissions('roles.read', 'roles.create')
```

**Permission guard logic**
1. Allow if `user.isSuperAdmin`.
2. Allow if `role.isSuperAdmin`.
3. Allow if `userPermissions` include the required values.
4. Otherwise throw `ForbiddenException`.

## 8 RBAC endpoints
**Permissions**
- `GET /permissions` guarded by `roles.read`.

**Tenants (platform)**
- `POST /tenants` (Super Admin only)

**Roles**
- `GET /roles` (`roles.read`)
- `POST /roles` (`roles.create`)
- `PUT /roles/:id` (`roles.update`)
- `DELETE /roles/:id` (`roles.delete`)

**Users directory (global)**
- `GET /tenant-users/invitable?search=` (`users.create`)
- Search by email or full name; returns `id`, `email`, `fullName`.
- Returns users not already in the active tenant; used to invite existing users.

**Tenant users**
- `GET /tenant-users` (`users.read`)
- `POST /tenant-users` (`users.create`)
- `PUT /tenant-users/:userId/role` (`users.assignRole`)
- `DELETE /tenant-users/:userId` (`users.delete`)
- `POST /tenant-users` accepts `userId` or `email`:
  - If the user exists, attach them to the tenant.
  - If not, create the user and attach.

**Tenant settings (active tenant)**
- `GET /tenant-settings/tenant` (`settings.tenant.read`)
- `PUT /tenant-settings/tenant` (`settings.tenant.update`)

## 9 Frontend UI migration (Tailwind + shadcn/ui)
### 9.1 Baseline setup (Tailwind + shadcn foundation)
- Install Tailwind in `apps/web` along with `tailwindcss`, `postcss`, and `autoprefixer`.
- Generate `tailwind.config.ts` and `postcss.config.mjs`.
- Configure the `content` paths to include:
  - `./app/**/*.{ts,tsx}`
  - `./components/**/*.{ts,tsx}`
  - `../../packages/shared/**/*.{ts,tsx}` (if shared UI/types are rendered)
- Add Tailwind directives to `apps/web/src/app/globals.css`:
  ```
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Remove or disable conflicting global styles (reset frameworks, Bootstrap, etc.).
- Install shadcn prerequisites: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
- Add `apps/web/src/lib/utils.ts` with a `cn()` helper.
- Run `shadcn init` in `apps/web` and confirm that:
  - The components path (e.g., `apps/web/components/ui`) exists.
  - The Tailwind config points to the correct file.
  - The global CSS path resolves to `app/globals.css`.
  - The default style is selected.
- Seed the theme tokens (CSS variables) for light/dark in `globals.css`, even if only light is used initially.
- Optionally add a `ThemeProvider` to prepare for later theming needs.

### 9.2 Remove/replace existing CSS framework usage
- Inventory current CSS sources: Bootstrap, custom files, CSS modules, styled-components, etc.
- Decide what to keep; only retain component-scoped CSS modules if truly needed.
- Prefer Tailwind utilities for layout and spacing; remove or isolate legacy styles.
- Delete legacy framework imports from `_app/layout`. If deletion isn't possible yet, scope them to legacy pages and avoid global selectors that override shadcn styles.

### 9.3 App shell (ERP layout)
- Build the authenticated layout at `/app/(authenticated)/layout.tsx` with:
  - Sidebar on the left.
  - Navbar on top.
  - Content outlet for child routes.
- Build the Navbar using shadcn parts:
  - Tenant dropdown (Popover or Select).
  - Profile avatar dropdown (DropdownMenu + Avatar).
  - Logout action.
- Build a collapsible sidebar that:
  - Supports expanded and icon-only modes.
  - Persists state to `localStorage`.
  - Shows tooltips when collapsed.
  - Uses shadcn components (Tooltip, Collapsible, Button for the toggle).

### 9.4 Common UI primitives
- Use the shadcn generator to add: `button`, `input`, `label`, `table`, `dropdown-menu`, `avatar`, `dialog`, `alert-dialog`, `select`, `checkbox`, `popover`, `tooltip`, `scroll-area`, `separator`, `badge`.
- Create reusable wrappers:
  - `PageHeader` (title + actions)
  - `EmptyState`
  - `LoadingState`
  - `DataTable` (basic table wrapper)

### 9.5 Permission-guarded menus (single source of truth)
- Build permission hooks such as `useMe()`, `usePermissions()`, and `useActiveTenant()` that expose:
  - `isSuperAdmin`
  - `can(permissionCode)`
  - `canAny([...])`
- Guard sidebar items using these helpers, hiding any item when `!canAny(requiredPerms)` and the user isn't a super admin.
- Keep the sidebar tree defined in a single file for easier updates.
- Settings group:
  - Tenant (`/settings/tenant`): visible to Super Admins or users with `settings.tenant.read`/`settings.tenant.update`. Uses active tenant info, but menu visibility is not gated by active tenant flags.
  - Tenants (`/settings/tenants`): Super Admin only (tenant creation is Super Admin only).
  - Taxes (`/settings/taxes`): Super Admin only (Cycle 2).
  - Audit Logs (`/settings/audit-logs`): Super Admin only (Cycle 2).
- Users group:
  - Roles: tenant-scoped; requires roles permissions.
  - Users: tenant-scoped; requires users permissions.

### 9.6 Cycle 1 page targets (shadcn UI)
- Login: shadcn inputs/buttons with inline error handling.
- Select tenant: tenant list or dropdown using shadcn `Card`, `Select`, `Button`.
- Roles: table with create/edit dialog (or separate page); grouped permission checklist.
- Users: table, add-by-email flow UI, and role assignment dropdown.
- Tenants (Super admin): table plus create-tenant dialog/form under `/settings/tenants`.

### 9.7 Routes & guards (Cycle 1 baseline)
- `/login`
- `/select-tenant`
- `/dashboard`
- `/settings/tenant`
- `/settings/tenants`
- `/settings/taxes` (Cycle 2)
- `/settings/audit-logs` (Cycle 2)
- `/settings/roles`
- `/settings/users`
- `/profile`

Guarded UI must reflect permission checks from the backend.

### 9.8 Sidebar structure (code-friendly)
```
const sidebar = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    label: 'Settings',
    collapsible: true,
    children: [
      {
        label: 'Tenant',
        icon: Building,
        href: '/settings/tenant',
        permissions: ['settings.tenant.read', 'settings.tenant.update'],
      },
      {
        label: 'Tenants',
        icon: Building,
        href: '/settings/tenants',
        superAdminOnly: true,
      },
      {
        label: 'Taxes',
        icon: Building,
        href: '/settings/taxes',
        superAdminOnly: true,
      },
      {
        label: 'Audit Logs',
        icon: Shield,
        href: '/settings/audit-logs',
        superAdminOnly: true,
      },
    ],
  },
  {
    label: 'Users',
    collapsible: true,
    children: [
      {
        label: 'Roles',
        icon: Shield,
        href: '/settings/roles',
        permissions: [
          'roles.read',
          'roles.create',
          'roles.update',
          'roles.delete',
        ],
      },
      {
        label: 'Users',
        icon: Users,
        href: '/settings/users',
        permissions: [
          'users.read',
          'users.create',
          'users.update',
          'users.assignRole',
          'users.delete',
        ],
      },
    ],
  },
];
```

## 10 UI guard rules (strict)
| Layer | Rule |
| --- | --- |
| Menu | Hidden when the user lacks the related permission. |
| Page | Block rendering when the user lacks the related permission. |
| Button | Disabled or hidden without permission. |
| API | Permission check always enforced server-side. |

No redundancies; guarding at every layer avoids security holes.

## 11 What to commit for Cycle-1
- Entities + migrations
- Seed script
- Guards + decorators
- Auth + RBAC endpoints
- Sidebar, Navbar, and layouts
- Permission-aware UI

> ✅ When Cycle-1 is done: "This ERP implements real multi-tenant RBAC with Super Admin, permission-guarded UI, and backend enforcement - production-grade from day one."
