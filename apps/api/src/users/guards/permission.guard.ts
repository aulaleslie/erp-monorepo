import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users.service';
import { PERMISSIONS_KEY } from '../../common/decorators/require-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    if (!user) {
      return false;
    }

    // 1. Allow if user.isSuperAdmin
    if (user.isSuperAdmin) {
      return true;
    }

    // If no tenant context, and not super admin, we can't check tenant permissions.
    // However, getPermissions handles undefined tenantId gracefully (returns empty).
    
    // 2. Allow if role.isSuperAdmin
    // 3. Allow if userPermissions include the required values
    const { superAdmin, permissions } = await this.usersService.getPermissions(
      user.id,
      tenantId,
    );

    if (superAdmin) {
      return true;
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      permissions?.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
