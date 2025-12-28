import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity } from '../../database/entities/user.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { RolePermissionEntity } from '../../database/entities/role-permission.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { MeController } from './me.controller';
import { TenantsModule } from '../tenants/tenants.module';

import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TenantUserEntity,
      RoleEntity,
      RolePermissionEntity,
      PermissionEntity,
    ]),
    forwardRef(() => TenantsModule),
  ],
  controllers: [MeController],
  providers: [UsersService, PermissionGuard],
  exports: [UsersService, PermissionGuard],
})
export class UsersModule {}
