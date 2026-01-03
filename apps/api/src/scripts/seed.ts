import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../../typeorm-datasource';
import { PermissionEntity } from '../database/entities/permission.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { TenantUserEntity } from '../database/entities/tenant-user.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { TenantThemeEntity } from '../database/entities/tenant-theme.entity';
import { UserEntity } from '../database/entities/user.entity';
import { permissionsData } from './seeds/permissions';
import { TenantType } from '@gym-monorepo/shared';

async function seed() {
  console.log('Initializing Data Source...');
  await AppDataSource.initialize();
  console.log('Data Source initialized.');

  // 1. Seed Permissions
  console.log('Seeding Permissions...');

  const permissionRepo = AppDataSource.getRepository(PermissionEntity);

  for (const perm of permissionsData) {
    const permission = await permissionRepo.findOneBy({ code: perm.code });
    if (!permission) {
      await permissionRepo.save(permissionRepo.create(perm));
    }
  }

  // 2. Seed Tenants
  console.log('Seeding Tenants...');
  const tenantsData = [
    { name: 'Gym', slug: 'gym', type: TenantType.GYM },
    { name: 'Cafeteria', slug: 'cafeteria', type: TenantType.EATERY },
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
  const tenantThemeRepo = AppDataSource.getRepository(TenantThemeEntity);

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

    // Create default theme for the tenant
    const existingTheme = await tenantThemeRepo.findOneBy({
      tenantId: tenant.id,
    });
    if (!existingTheme) {
      await tenantThemeRepo.save(
        tenantThemeRepo.create({
          tenantId: tenant.id,
          presetId: 'corporate-blue',
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
