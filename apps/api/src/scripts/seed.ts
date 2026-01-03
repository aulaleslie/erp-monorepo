import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../../typeorm-datasource';
import { PermissionEntity } from '../database/entities/permission.entity';
import { RolePermissionEntity } from '../database/entities/role-permission.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { UserEntity } from '../database/entities/user.entity';
import { permissionsData } from './seeds/permissions';

async function seed() {
  console.log('Initializing Data Source...');
  await AppDataSource.initialize();
  console.log('Data Source initialized.');

  // 1. Seed Permissions
  console.log('Seeding Permissions...');

  const permissionRepo = AppDataSource.getRepository(PermissionEntity);
  const allPermissions: PermissionEntity[] = [];

  for (const perm of permissionsData) {
    let permission = await permissionRepo.findOneBy({ code: perm.code });
    if (!permission) {
      permission = await permissionRepo.save(permissionRepo.create(perm));
    }
    allPermissions.push(permission);
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

    // Assign all permissions to Super Admin Role (Ensuring they are linked)
    for (const perm of allPermissions) {
      const exists = await rolePermissionRepo.findOneBy({
        roleId: adminRole.id,
        permissionId: perm.id,
      });

      if (!exists) {
        await rolePermissionRepo.save(
          rolePermissionRepo.create({
            roleId: adminRole.id,
            permissionId: perm.id,
          }),
        );
      }
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
