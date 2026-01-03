import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AUTH_ERRORS } from '@gym-monorepo/shared';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.isSuperAdmin) {
      throw new ForbiddenException(AUTH_ERRORS.SUPER_ADMIN_ONLY.message);
    }

    return true;
  }
}
