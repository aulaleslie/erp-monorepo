import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { UserEntity } from '../../database/entities';

type AuthUser = Pick<UserEntity, 'id' | 'email' | 'isSuperAdmin'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<UserEntity, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash: _passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: AuthUser): { access_token: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findUserById(id: string) {
    return this.usersService.findOneById(id);
  }
}
