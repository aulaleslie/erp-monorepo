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
- Permissions to seed: `roles.read`, `roles.create`, `roles.update`, `roles.delete`, `users.read`, `users.create`, `users.update`, `users.assignRole`, `tenants.create`.
- Tenants to seed: Gym, Cafeteria.
- Create one Super Admin user (`isSuperAdmin = true`) and a Super Admin role per tenant (`isSuperAdmin = true`).
- Assign the Super Admin user to both tenants so the system is demo-ready without registration.

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

**Roles**
- `GET /roles` (`roles.read`)
- `POST /roles` (`roles.create`)
- `PUT /roles/:id` (`roles.update`)
- `DELETE /roles/:id` (`roles.delete`)

**Tenant users**
- `GET /tenant-users` (`users.read`)
- `POST /tenant-users` (`users.create`)
- `PUT /tenant-users/:userId/role` (`users.assignRole`)

**Tenants (platform)**
- `POST /tenants` — restricted to `user.isSuperAdmin === true`.

## 9 Frontend — routes & guards
- `/login`
- `/select-tenant`
- `/app`
- `/app/dashboard`
- `/app/settings/roles`
- `/app/settings/users`
- `/app/platform/tenants`
- `/app/profile`

Guarded UI must reflect permission checks from the backend.

## 10 Sidebar structure (code-friendly)
```
const sidebar = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/app/dashboard',
  },
  {
    label: 'Settings',
    collapsible: true,
    children: [
      {
        label: 'Roles',
        icon: Shield,
        href: '/app/settings/roles',
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
        href: '/app/settings/users',
        permissions: [
          'users.read',
          'users.create',
          'users.update',
          'users.assignRole',
        ],
      },
    ],
  },
  {
    label: 'Platform',
    superAdminOnly: true,
    children: [
      {
        label: 'Tenants',
        icon: Building,
        href: '/app/platform/tenants',
      },
    ],
  },
];
```

## 11 Navbar
- **Right side:** Avatar dropdown → Profile (`/app/profile`) and Logout (`/auth/logout`).
- **Left side:** Tenant dropdown that calls `/tenants/active` and triggers a permission reload.

## 12 UI guard rules (strict)
| Layer | Rule |
| --- | --- |
| Menu | Hidden when the user lacks the related permission. |
| Page | Block rendering when the user lacks the related permission. |
| Button | Disabled or hidden without permission. |
| API | Permission check always enforced server-side. |

No redundancies; guarding at every layer avoids security holes.

## 13 What to commit for Cycle-1
- Entities + migrations
- Seed script
- Guards + decorators
- Auth + RBAC endpoints
- Sidebar, Navbar, and layouts
- Permission-aware UI

> ✅ When Cycle-1 is done: “This ERP implements real multi-tenant RBAC with Super Admin, permission-guarded UI, and backend enforcement — production-grade from day one.”
