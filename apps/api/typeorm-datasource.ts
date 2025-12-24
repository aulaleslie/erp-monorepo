import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from './src/database/entities/user.entity';
import { TenantEntity } from './src/database/entities/tenant.entity';
import { PermissionEntity } from './src/database/entities/permission.entity';
import { RoleEntity } from './src/database/entities/role.entity';
import { RolePermissionEntity } from './src/database/entities/role-permission.entity';
import { TenantUserEntity } from './src/database/entities/tenant-user.entity';
import { AuditLogEntity } from './src/database/entities/audit-log.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  entities: [
    UserEntity,
    TenantEntity,
    PermissionEntity,
    RoleEntity,
    RolePermissionEntity,
    TenantUserEntity,
    AuditLogEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
