import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from './src/database/entities/user.entity';
import { TenantEntity } from './src/database/entities/tenant.entity';
import { PermissionEntity } from './src/database/entities/permission.entity';
import { RoleEntity } from './src/database/entities/role.entity';
import { RolePermissionEntity } from './src/database/entities/role-permission.entity';
import { TenantUserEntity } from './src/database/entities/tenant-user.entity';
import { AuditLogEntity } from './src/database/entities/audit-log.entity';
import { TaxEntity } from './src/database/entities/tax.entity';
import { TenantCounterEntity } from './src/database/entities/tenant-counter.entity';
import { TenantTaxEntity } from './src/database/entities/tenant-tax.entity';
import { TenantThemeEntity } from './src/database/entities/tenant-theme.entity';
import { PeopleEntity } from './src/database/entities/people.entity';
import { DepartmentEntity } from './src/database/entities/department.entity';
import { CategoryEntity } from './src/database/entities/category.entity';
import { ItemEntity } from './src/database/entities/item.entity';
import { ALL_ENTITIES } from './src/database/entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  extra: {
    options: '-c timezone=UTC',
  },
  entities: ALL_ENTITIES,
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

