import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../../typeorm-datasource';
import { PermissionEntity } from '../database/entities/permission.entity';
import { RolePermissionEntity } from '../database/entities/role-permission.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { UserEntity } from '../database/entities/user.entity';

async function seed() {
  console.log('Initializing Data Source...');
  await AppDataSource.initialize();
  console.log('Data Source initialized.');

  // 1. Seed Permissions
  console.log('Seeding Permissions...');
  const permissionsData = [
    { code: 'roles.read', name: 'Read Roles', group: 'Settings' },
    { code: 'roles.create', name: 'Create Roles', group: 'Settings' },
    { code: 'roles.update', name: 'Update Roles', group: 'Settings' },
    { code: 'roles.delete', name: 'Delete Roles', group: 'Settings' },
    { code: 'users.read', name: 'Read Users', group: 'Users' },
    { code: 'users.create', name: 'Create Users', group: 'Users' },
    { code: 'users.update', name: 'Update Users', group: 'Users' },
    { code: 'users.assignRole', name: 'Assign Role', group: 'Users' },
    { code: 'tenants.create', name: 'Create Tenants', group: 'Platform' },
  ];

  const permissionRepo = AppDataSource.getRepository(PermissionEntity);
  for (const perm of permissionsData) {
    const exists = await permissionRepo.findOneBy({ code: perm.code });
    if (!exists) {
      await permissionRepo.save(permissionRepo.create(perm));
    }
  }

  // 2. Seed Tenants
  console.log('Seeding Tenants...');
  const tenantsData = [
    { name: 'Gym', slug: 'gym' },
    { name: 'Cafeteria', slug: 'cafeteria' },
  ];
  const tenantRepo = AppDataSource.getRepository(TenantEntity);
  const createdTenants: TenantEntity[] = [];

  for (const t of tenantsData) {
    let tenant = await tenantRepo.findOneBy({ slug: t.slug });
    if (!tenant) {
      tenant = await tenantRepo.save(tenantRepo.create(t));
    }
    createdTenants.push(tenant);
  }

  // 3. Seed Super Admin User
  console.log('Seeding Super Admin User...');
  const userRepo = AppDataSource.getRepository(UserEntity);
  const adminEmail = 'admin@gym.com';
  let adminUser = await userRepo.findOneBy({ email: adminEmail });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash('password123', 10);
    adminUser = await userRepo.save(
      userRepo.create({
        email: adminEmail,
        passwordHash,
        fullName: 'Admin',
        isSuperAdmin: true,
        status: 'ACTIVE',
      }),
    );
  }

  // 4. Seed Roles and Assign to Admin
  console.log('Seeding Roles and Assigning to Admin...');
  const roleRepo = AppDataSource.getRepository(RoleEntity);
  const tenantUserRepo = AppDataSource.getRepository(TenantUserEntity);
  const rolePermissionRepo = AppDataSource.getRepository(RolePermissionEntity);

  // Get all permissions to assign to Super Admin Role (optional, as isSuperAdmin=true on role should handle it, but specs say "Permissions to seed... Create one Super Admin role")
  // Actually, CYCLE_1 says "Create one Super Admin user (`isSuperAdmin = true`) and a Super Admin role per tenant (`isSuperAdmin = true`)."
  // Permission guard logic: Allow if role.isSuperAdmin. So we don't strictly need to link all permissions to this role, but for completeness or if logic changes, we might?
  // Check Guard Logic:
  // 1. Allow if user.isSuperAdmin. (Admin User has this)
  // 2. Allow if role.isSuperAdmin. (Admin Role has this)
  // So linking permissions is not strictly required for the Super Admin Role to work, but we should create the role.

  for (const tenant of createdTenants) {
    let adminRole = await roleRepo.findOne({
      where: { tenantId: tenant.id, name: 'Super Admin' },
    });

    if (!adminRole) {
      adminRole = await roleRepo.save(
        roleRepo.create({
          tenantId: tenant.id,
          name: 'Super Admin',
          isSuperAdmin: true,
        }),
      );
    }

    // Assign Admin User to this Tenant with this Role
    const tenantUser = await tenantUserRepo.findOneBy({
      tenantId: tenant.id,
      userId: adminUser.id,
    });

    if (!tenantUser) {
      await tenantUserRepo.save(
        tenantUserRepo.create({
          tenantId: tenant.id,
          userId: adminUser.id,
          roleId: adminRole.id,
        }),
      );
    }
  }

  console.log('Seeding complete.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
