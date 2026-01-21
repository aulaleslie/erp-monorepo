import * as bcrypt from 'bcrypt';
import { DataSource, Raw } from 'typeorm';
import { AppDataSource } from '../../typeorm-datasource';
import {
  PeopleEntity,
  PermissionEntity,
  RoleEntity,
  TenantEntity,
  TenantThemeEntity,
  TenantUserEntity,
  UserEntity,
} from '../database/entities';
import { permissionsData } from './seeds/permissions';
import { seedCatalog } from './seeds/catalog';
import { seedDocumentEngine } from './seeds/document-engine';
import { PeopleType, TenantType } from '@gym-monorepo/shared';
import { TenantCountersService } from '../modules/tenant-counters/tenant-counters.service';

const DEFAULT_TENANTS = [
  { name: 'Gym', slug: 'gym', type: TenantType.GYM },
  { name: 'Cafeteria', slug: 'cafeteria', type: TenantType.EATERY },
];
const ADMIN_EMAIL = 'admin@gym.com';
const ADMIN_PASSWORD = 'password123';

type Seeder = {
  name: string;
  run: (dataSource: DataSource) => Promise<void>;
};

const seedPermissions = async (dataSource: DataSource): Promise<void> => {
  console.log('Seeding Permissions...');
  const permissionRepo = dataSource.getRepository(PermissionEntity);

  for (const perm of permissionsData) {
    const permission = await permissionRepo.findOneBy({ code: perm.code });
    if (!permission) {
      await permissionRepo.save(permissionRepo.create(perm));
    }
  }
};

const seedTenants = async (dataSource: DataSource): Promise<void> => {
  console.log('Seeding Tenants...');
  const tenantRepo = dataSource.getRepository(TenantEntity);

  for (const tenantData of DEFAULT_TENANTS) {
    let tenant = await tenantRepo.findOneBy({ slug: tenantData.slug });
    if (!tenant) {
      tenant = await tenantRepo.save(tenantRepo.create(tenantData));
    }
  }
};

const seedAdminUser = async (dataSource: DataSource): Promise<void> => {
  console.log('Seeding Super Admin User...');
  const userRepo = dataSource.getRepository(UserEntity);
  let adminUser = await userRepo.findOneBy({ email: ADMIN_EMAIL });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    adminUser = await userRepo.save(
      userRepo.create({
        email: ADMIN_EMAIL,
        passwordHash,
        fullName: 'Admin',
        isSuperAdmin: true,
        status: 'ACTIVE',
      }),
    );
  }
};

const seedRolesAndAssignments = async (
  dataSource: DataSource,
): Promise<void> => {
  console.log('Seeding Roles and Assigning to Admin...');
  const tenantRepo = dataSource.getRepository(TenantEntity);
  const tenants = await tenantRepo.find();

  if (tenants.length === 0) {
    console.log('No tenants found. Skipping role assignment.');
    return;
  }

  const userRepo = dataSource.getRepository(UserEntity);
  const adminUser = await userRepo.findOneBy({ email: ADMIN_EMAIL });

  if (!adminUser) {
    console.log('Super Admin user not found. Skipping role assignment.');
    return;
  }

  const roleRepo = dataSource.getRepository(RoleEntity);
  const tenantUserRepo = dataSource.getRepository(TenantUserEntity);
  const tenantThemeRepo = dataSource.getRepository(TenantThemeEntity);

  for (const tenant of tenants) {
    const superAdminRoles = await roleRepo.find({
      where: { tenantId: tenant.id, name: 'Super Admin' },
      order: { createdAt: 'ASC' },
    });

    const [existingRole] = superAdminRoles;
    let adminRole = existingRole;

    if (!adminRole) {
      adminRole = await roleRepo.save(
        roleRepo.create({
          tenantId: tenant.id,
          name: 'Super Admin',
          isSuperAdmin: true,
        }),
      );
    }

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
};

const seedWalkInCustomers = async (dataSource: DataSource): Promise<void> => {
  console.log('Seeding Walk-in Customers...');
  const tenantRepo = dataSource.getRepository(TenantEntity);
  const tenants = await tenantRepo.find();

  if (tenants.length === 0) {
    console.log('No tenants found. Skipping walk-in customers.');
    return;
  }

  const peopleRepo = dataSource.getRepository(PeopleEntity);
  const tenantCountersService = new TenantCountersService(dataSource);

  for (const tenant of tenants) {
    const existingWalkIn = await peopleRepo.findOne({
      where: {
        tenantId: tenant.id,
        type: PeopleType.CUSTOMER,
        tags: Raw((alias) => `${alias} @> '["walk-in"]'`),
      },
    });

    if (existingWalkIn) {
      continue;
    }

    const code = await tenantCountersService.getNextPeopleCode(
      tenant.id,
      PeopleType.CUSTOMER,
    );
    await peopleRepo.save(
      peopleRepo.create({
        tenantId: tenant.id,
        type: PeopleType.CUSTOMER,
        code,
        fullName: 'Walk in',
        tags: ['walk-in'],
      }),
    );
  }
};

const SEEDERS: Seeder[] = [
  { name: 'permissions', run: seedPermissions },
  { name: 'tenants', run: seedTenants },
  { name: 'admin', run: seedAdminUser },
  { name: 'roles', run: seedRolesAndAssignments },
  { name: 'walk-in', run: seedWalkInCustomers },
  { name: 'catalog', run: seedCatalog },
  { name: 'document-engine', run: seedDocumentEngine },
];

const parseList = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getArgValue = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
};

const pickSeeders = (
  args: string[],
  available: Seeder[],
): { selected: Seeder[]; stop: boolean } => {
  const only = parseList(getArgValue(args, '--only'));
  const skip = parseList(getArgValue(args, '--skip'));
  const list = args.includes('--list');

  if (list) {
    console.log(
      `Available seeders: ${available.map((s) => s.name).join(', ')}`,
    );
    return { selected: [], stop: true };
  }

  const availableNames = new Set(available.map((s) => s.name));
  const unknownOnly = only.filter((name) => !availableNames.has(name));
  const unknownSkip = skip.filter((name) => !availableNames.has(name));
  const unknown = [...unknownOnly, ...unknownSkip];

  if (unknown.length > 0) {
    console.error(
      `Unknown seeders: ${unknown.join(', ')}. Use --list to see valid names.`,
    );
    return { selected: [], stop: true };
  }

  let selected = available;
  if (only.length > 0) {
    selected = available.filter((seeder) => only.includes(seeder.name));
  }
  if (skip.length > 0) {
    selected = selected.filter((seeder) => !skip.includes(seeder.name));
  }

  return { selected, stop: false };
};

async function seed() {
  const args = process.argv.slice(2);
  const { selected, stop } = pickSeeders(args, SEEDERS);

  if (stop) {
    return;
  }

  if (selected.length === 0) {
    console.log('No seeders selected.');
    return;
  }

  console.log('Initializing Data Source...');
  await AppDataSource.initialize();
  console.log('Data Source initialized.');

  try {
    for (const seeder of selected) {
      await seeder.run(AppDataSource);
    }

    console.log('Seeding complete.');
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
