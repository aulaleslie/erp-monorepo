import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { FastifyRequest } from 'fastify';

@Controller('me')
@UseGuards(AuthGuard('jwt'))
export class MeController {
  constructor(private usersService: UsersService) {}

  @Get('permissions')
  async getPermissions(@Req() req: FastifyRequest & { user: any }) {
    const tenantId = req.cookies['active_tenant'];
    return this.usersService.getPermissions(req.user.id, tenantId);
  }
}
