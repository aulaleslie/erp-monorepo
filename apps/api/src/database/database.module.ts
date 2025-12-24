import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RoleEntity } from './entities/role.entity';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { TenantEntity } from './entities/tenant.entity';
import { UserEntity } from './entities/user.entity';

import { AuditLogEntity } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        ssl: configService.get<string>('DB_SSL') === 'true',
        entities: [
          UserEntity,
          TenantEntity,
          PermissionEntity,
          RoleEntity,
          RolePermissionEntity,
          TenantUserEntity,
          AuditLogEntity,
        ],
        autoLoadEntities: true,
        synchronize: false, // checking explicitly as per requirements
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
