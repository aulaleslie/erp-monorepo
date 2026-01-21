import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithUser } from '../types/request';

/**
 * JWT payload structure from the auth token
 */
export interface JwtPayload {
  id: string;
  email: string;
  isSuperAdmin: boolean;
}

/**
 * Parameter decorator to extract the current user from the request
 * @param data Optional property of the user to extract (e.g., 'id', 'email')
 *
 * @example
 * // Get entire user object
 * async getProfile(@CurrentUser() user: JwtPayload) { }
 *
 * // Get specific property
 * async getProfile(@CurrentUser('id') userId: string) { }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
