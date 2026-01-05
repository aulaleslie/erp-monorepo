import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';

@ApiTags('platform')
@ApiCookieAuth('access_token')
@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'))
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(@Request() req, @Query() query: AuditLogsQueryDto) {
    if (!req.user?.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can access audit logs');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const from = query.from ? parseDateParam('from', query.from) : undefined;
    const to = query.to ? parseDateParam('to', query.to) : undefined;

    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('`from` must be before `to`.');
    }

    return this.auditLogsService.findAll(page, limit, {
      entityName: query.entityName,
      performedBy: query.performedBy,
      from,
      to,
      action: query.action,
    });
  }
}

function parseDateParam(label: string, value: string): Date {
  if (!hasTimezoneOffset(value)) {
    throw new BadRequestException(
      `${label} must include a timezone offset (e.g. 2024-01-01T10:00:00Z).`,
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${label} must be a valid date-time.`);
  }
  return parsed;
}

function hasTimezoneOffset(value: string): boolean {
  return /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
}
