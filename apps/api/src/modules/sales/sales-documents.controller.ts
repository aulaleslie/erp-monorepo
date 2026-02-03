import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { ActiveTenantGuard } from '../../common/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { SalesPdfService } from './pdf/sales-pdf.service';

@ApiTags('sales-documents')
@ApiCookieAuth('access_token')
@Controller('sales/documents')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class SalesDocumentsController {
  constructor(private readonly salesPdfService: SalesPdfService) {}

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Get existing PDF URL or generate if not exists' })
  @RequirePermissions(PERMISSIONS.SALES.READ)
  async getPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Query('force') force?: string,
  ) {
    const isForce = force === 'true';
    const url = await this.salesPdfService.getPdfUrl(tenantId, id, isForce);
    return { url };
  }

  @Post(':id/pdf')
  @ApiOperation({ summary: 'Force generate PDF and return URL' })
  @RequirePermissions(PERMISSIONS.SALES.READ)
  async generatePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    const url = await this.salesPdfService.getPdfUrl(tenantId, id, true);
    return { url };
  }
}
