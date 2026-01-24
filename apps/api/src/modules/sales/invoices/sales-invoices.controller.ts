import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DocumentStatus, PERMISSIONS } from '@gym-monorepo/shared';
import { ActiveTenantGuard } from '../../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SalesInvoicesService } from './sales-invoices.service';
import { CreateSalesInvoiceDto } from './dtos/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dtos/update-sales-invoice.dto';
import {
  ApproveDocumentDto,
  CancelDocumentDto,
  RejectDocumentDto,
  RequestRevisionDto,
} from '../../documents/dto/workflow-document.dto';

import { SalesCreditNotesService } from '../credit-notes/sales-credit-notes.service';
import { CreateSalesCreditNoteDto } from '../credit-notes/dtos/create-sales-credit-note.dto';

@ApiTags('sales-invoices')
@ApiCookieAuth('access_token')
@Controller('sales/invoices')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class SalesInvoicesController {
  constructor(
    private readonly salesInvoicesService: SalesInvoicesService,
    private readonly salesCreditNotesService: SalesCreditNotesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List sales invoices' })
  @RequirePermissions(PERMISSIONS.SALES.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: DocumentStatus,
    @Query('personId') personId?: string,
    @Query('number') number?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesInvoicesService.findAll(tenantId, {
      status,
      personId,
      number,
      search,
      tag,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales invoice by ID' })
  @RequirePermissions(PERMISSIONS.SALES.READ)
  async findOne(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.findOne(id, tenantId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create sales invoice' })
  @RequirePermissions(PERMISSIONS.SALES.CREATE)
  async create(
    @Body() dto: CreateSalesInvoiceDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.create(tenantId, dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sales invoice' })
  @RequirePermissions(PERMISSIONS.SALES.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesInvoiceDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.update(id, tenantId, dto, userId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit sales invoice' })
  @RequirePermissions(PERMISSIONS.SALES.SUBMIT)
  async submit(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.submit(id, tenantId, userId);
  }

  @Post(':id/approve/:stepIndex')
  @ApiOperation({ summary: 'Approve sales invoice step' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async approveStep(
    @Param('id') id: string,
    @Param('stepIndex') stepIndex: string,
    @Body() dto: ApproveDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.approveStep(
      id,
      parseInt(stepIndex, 10),
      dto.notes || '',
      tenantId,
      userId,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject sales invoice' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.reject(id, dto.reason, tenantId, userId);
  }

  @Post(':id/request-revision')
  @ApiOperation({ summary: 'Request revision for sales invoice' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async requestRevision(
    @Param('id') id: string,
    @Body() dto: RequestRevisionDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.requestRevision(
      id,
      dto.reason,
      tenantId,
      userId,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sales invoice' })
  @RequirePermissions(PERMISSIONS.SALES.CANCEL)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.cancel(
      id,
      dto.reason || '',
      tenantId,
      userId,
    );
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post sales invoice' })
  @RequirePermissions(PERMISSIONS.SALES.INVOICES_POST)
  async post(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesInvoicesService.post(id, tenantId, userId);
  }

  @Post(':id/credit-notes')
  @ApiOperation({ summary: 'Create credit note from invoice' })
  @RequirePermissions(PERMISSIONS.SALES.CREATE)
  async createCreditNote(
    @Param('id') id: string,
    @Body() dto: CreateSalesCreditNoteDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.createFromInvoice(
      id,
      tenantId,
      dto,
      userId,
    );
  }
}
