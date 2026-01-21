import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
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
import { DocumentNumberService } from './document-number.service';
import { UsersService } from '../users/users.service';
import {
  ApproveDocumentDto,
  CancelDocumentDto,
  RejectDocumentDto,
  RequestRevisionDto,
} from './dto/workflow-document.dto';
import { UpdateDocumentNumberSettingsDto } from './dto/document-number-settings.dto';
import { CreateDocumentDto } from './dto/create-document.dto';

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
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentNumberService: DocumentNumberService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new draft document' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.SUBMIT)
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const { documentKey, module, ...data } = dto;

    // Module-specific permission check
    await this.checkModulePermission(userId, tenantId, module, 'CREATE');

    return this.documentsService.create(
      tenantId,
      documentKey,
      module,
      {
        ...data,
        documentDate: new Date(data.documentDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      userId,
    );
  }

  @Get('number-settings')
  @ApiOperation({ summary: 'Get all document number settings' })
  @RequirePermissions(PERMISSIONS.SETTINGS.TENANT.READ)
  async getAllNumberSettings(@CurrentTenant() tenantId: string) {
    return this.documentNumberService.findAllSettings(tenantId);
  }

  @Get('number-settings/:documentKey')
  @ApiOperation({ summary: 'Get document number setting for a specific key' })
  @RequirePermissions(PERMISSIONS.SETTINGS.TENANT.READ)
  async getNumberSetting(
    @CurrentTenant() tenantId: string,
    @Param('documentKey') documentKey: string,
  ) {
    return this.documentNumberService.findOneSetting(tenantId, documentKey);
  }

  @Put('number-settings/:documentKey')
  @ApiOperation({ summary: 'Update document number setting' })
  @RequirePermissions(PERMISSIONS.SETTINGS.TENANT.UPDATE)
  async updateNumberSetting(
    @CurrentTenant() tenantId: string,
    @Param('documentKey') documentKey: string,
    @Body() dto: UpdateDocumentNumberSettingsDto,
  ) {
    return this.documentNumberService.updateSetting(tenantId, documentKey, dto);
  }

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
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.documentsService.findOne(id, tenantId, userId);
    await this.checkModulePermission(userId, tenantId, document.module, 'READ');
    return this.documentsService.getStatusHistory(id, tenantId, userId);
  }

  @Get(':id/approvals')
  @ApiOperation({ summary: 'Get document approvals' })
  @RequirePermissions(PERMISSIONS.DOCUMENTS.READ)
  async getApprovals(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.documentsService.findOne(id, tenantId, userId);
    await this.checkModulePermission(userId, tenantId, document.module, 'READ');
    return this.documentsService.getApprovals(id, tenantId, userId);
  }

  private async checkModulePermission(
    userId: string,
    tenantId: string,
    module: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
  ) {
    const { superAdmin, permissions } = await this.usersService.getPermissions(
      userId,
      tenantId,
    );

    if (superAdmin) return;

    const moduleUpper = module.toUpperCase();
    const permissionsMap = PERMISSIONS as unknown as Record<
      string,
      Record<string, string>
    >;
    const modulePermissions = permissionsMap[moduleUpper];
    const permissionCode = modulePermissions
      ? modulePermissions[action]
      : undefined;

    if (permissionCode && !permissions?.includes(permissionCode)) {
      throw new ForbiddenException(
        `Insufficient module permissions: ${permissionCode} required`,
      );
    }
  }
}
