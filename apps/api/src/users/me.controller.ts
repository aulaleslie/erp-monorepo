import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { FastifyRequest } from 'fastify';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('me')
@UseGuards(AuthGuard('jwt'))
export class MeController {
  constructor(private usersService: UsersService) {}

  @Get('permissions')
  async getPermissions(@Req() req: FastifyRequest & { user: any }) {
    const tenantId = req.cookies['active_tenant'];
    return this.usersService.getPermissions(req.user.id, tenantId);
  }

  @Get('tenants')
  async getMyTenants(@Req() req: FastifyRequest & { user: any }) {
    return this.usersService.getUserTenants(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: FastifyRequest & { user: any },
    @Body() body: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(req.user.id, {
      fullName: body.fullName,
    });
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  @Patch('password')
  async updatePassword(
    @Req() req: FastifyRequest & { user: any },
    @Body() body: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password updated successfully' };
  }
}
