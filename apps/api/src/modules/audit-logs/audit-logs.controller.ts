import { Controller, Get, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'))
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('entityName') entityName?: string,
    @Query('performedBy') performedBy?: string,
  ) {
    if (!req.user?.isSuperAdmin) {
        throw new ForbiddenException('Only Super Admins can access audit logs');
    }

    return this.auditLogsService.findAll(Number(page), Number(limit), {
      entityName,
      performedBy,
    });
  }
}
