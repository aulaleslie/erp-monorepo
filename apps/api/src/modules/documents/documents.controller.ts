import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS } from '@gym-monorepo/shared';
import { ActiveTenantGuard } from '../tenants/guards/active-tenant.guard';
import { TenantMembershipGuard } from '../tenants/guards/tenant-membership.guard';
import { PermissionGuard } from '../users/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import {
  ApproveDocumentDto,
  CancelDocumentDto,
  RejectDocumentDto,
  RequestRevisionDto,
} from './dto/workflow-document.dto';

@ApiTags('documents')
@ApiCookieAuth('access_token')
@Controller('documents')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit document for approval' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.SUBMIT)
  async submit(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.submit(id, tenantId, userId);
  }

  @Post(':id/approve/:stepIndex')
  @ApiOperation({ summary: 'Approve a specific step of the document' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.APPROVE)
  async approveStep(
    @Param('id') id: string,
    @Param('stepIndex') stepIndex: string,
    @Body() dto: ApproveDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.approveStep(
      id,
      parseInt(stepIndex, 10),
      dto.notes || null,
      tenantId,
      userId,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject document' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.REJECT)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.reject(id, dto.reason, tenantId, userId);
  }

  @Post(':id/request-revision')
  @ApiOperation({ summary: 'Request revision for document' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.REVISE)
  async requestRevision(
    @Param('id') id: string,
    @Body() dto: RequestRevisionDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.requestRevision(
      id,
      dto.reason,
      tenantId,
      userId,
    );
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post document' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.POST)
  async post(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.post(id, tenantId, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel document' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.CANCEL)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.cancel(
      id,
      dto.reason || null,
      tenantId,
      userId,
    );
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get document status history' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.READ)
  async getStatusHistory(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.documentsService.getStatusHistory(id, tenantId);
  }

  @Get(':id/approvals')
  @ApiOperation({ summary: 'Get document approvals' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.READ)
  async getApprovals(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.documentsService.getApprovals(id, tenantId);
  }
}
