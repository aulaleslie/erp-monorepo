import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

type JwtTokenPayload = {
  sub: string;
  email: string;
  isSuperAdmin: boolean;
};

type RequestWithCookies = FastifyRequest & {
  cookies?: Record<string, string>;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request?: RequestWithCookies) =>
          request?.cookies?.access_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  validate(payload: JwtTokenPayload): JwtPayload {
    return {
      id: payload.sub,
      email: payload.email,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
