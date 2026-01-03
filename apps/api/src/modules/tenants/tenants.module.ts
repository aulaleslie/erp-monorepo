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
import { TenantEntity } from '../../database/entities/tenant.entity';
import { TenantUserEntity } from '../../database/entities/tenant-user.entity';
import { TenantThemeEntity } from '../../database/entities/tenant-theme.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { RolePermissionEntity } from '../../database/entities/role-permission.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { TaxEntity } from '../../database/entities/tax.entity';
import { TenantTaxEntity } from '../../database/entities/tenant-tax.entity';
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
