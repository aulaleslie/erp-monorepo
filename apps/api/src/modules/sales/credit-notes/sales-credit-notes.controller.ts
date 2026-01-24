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
import { SalesCreditNotesService } from './sales-credit-notes.service';
import { UpdateSalesCreditNoteDto } from './dtos/update-sales-credit-note.dto';
import {
  ApproveDocumentDto,
  CancelDocumentDto,
  RejectDocumentDto,
  RequestRevisionDto,
} from '../../documents/dto/workflow-document.dto';

@ApiTags('sales-credit-notes')
@ApiCookieAuth('access_token')
@Controller('sales/credit-notes')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class SalesCreditNotesController {
  constructor(
    private readonly salesCreditNotesService: SalesCreditNotesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List sales credit notes' })
  @RequirePermissions(PERMISSIONS.SALES.READ)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: DocumentStatus,
    @Query('personId') personId?: string,
    @Query('number') number?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesCreditNotesService.findAll(tenantId, {
      status,
      personId,
      number,
      search,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales credit note by ID' })
  @RequirePermissions(PERMISSIONS.SALES.READ)
  async findOne(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.findOne(id, tenantId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sales credit note' })
  @RequirePermissions(PERMISSIONS.SALES.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesCreditNoteDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.update(id, tenantId, dto, userId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit sales credit note' })
  @RequirePermissions(PERMISSIONS.SALES.SUBMIT)
  async submit(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.submit(id, tenantId, userId);
  }

  @Post(':id/approve/:stepIndex')
  @ApiOperation({ summary: 'Approve sales credit note step' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async approveStep(
    @Param('id') id: string,
    @Param('stepIndex') stepIndex: string,
    @Body() dto: ApproveDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.approveStep(
      id,
      parseInt(stepIndex, 10),
      dto.notes || '',
      tenantId,
      userId,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject sales credit note' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.reject(
      id,
      dto.reason,
      tenantId,
      userId,
    );
  }

  @Post(':id/request-revision')
  @ApiOperation({ summary: 'Request revision for sales credit note' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async requestRevision(
    @Param('id') id: string,
    @Body() dto: RequestRevisionDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.requestRevision(
      id,
      dto.reason,
      tenantId,
      userId,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sales credit note' })
  @RequirePermissions(PERMISSIONS.SALES.CANCEL)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.cancel(
      id,
      dto.reason || '',
      tenantId,
      userId,
    );
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post sales credit note' })
  @RequirePermissions(PERMISSIONS.SALES.INVOICES_POST) // Assuming same permission as invoices for now, or needs new one
  async post(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesCreditNotesService.post(id, tenantId, userId);
  }
}
