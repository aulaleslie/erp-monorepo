import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TenantUsersController } from './tenant-users.controller';
import { TenantUsersService } from './tenant-users.service';
import {
  PermissionEntity,
  RoleEntity,
  RolePermissionEntity,
  TaxEntity,
  TenantEntity,
  TenantTaxEntity,
  TenantThemeEntity,
  TenantUserEntity,
  UserEntity,
} from '../../database/entities';
import { UsersModule } from '../users/users.module';
import { ActiveTenantGuard } from './guards/active-tenant.guard';
import { TenantMembershipGuard } from './guards/tenant-membership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      TenantUserEntity,
      TenantThemeEntity,
      UserEntity,
      RoleEntity,
      RolePermissionEntity,
      PermissionEntity,
      TaxEntity,
      TenantTaxEntity,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    TenantsController,
    RolesController,
    PermissionsController,
    TenantUsersController,
  ],
  providers: [
    TenantsService,
    RolesService,
    PermissionsService,
    TenantUsersService,
    ActiveTenantGuard,
    TenantMembershipGuard,
  ],
  exports: [TenantsService, ActiveTenantGuard, TenantMembershipGuard],
})
export class TenantsModule {}
