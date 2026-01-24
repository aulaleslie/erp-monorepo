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
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto } from './dtos/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dtos/update-sales-order.dto';
import {
  ApproveDocumentDto,
  CancelDocumentDto,
  RejectDocumentDto,
  RequestRevisionDto,
} from '../../documents/dto/workflow-document.dto';

@ApiTags('sales-orders')
@ApiCookieAuth('access_token')
@Controller('sales/orders')
@UseGuards(
  AuthGuard('jwt'),
  ActiveTenantGuard,
  TenantMembershipGuard,
  PermissionGuard,
)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List sales orders' })
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
    return this.salesOrdersService.findAll(tenantId, {
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
  @ApiOperation({ summary: 'Get sales order by ID' })
  @RequirePermissions(PERMISSIONS.SALES.READ)
  async findOne(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.findOne(id, tenantId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create sales order' })
  @RequirePermissions(PERMISSIONS.SALES.CREATE)
  async create(
    @Body() dto: CreateSalesOrderDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.create(tenantId, dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sales order' })
  @RequirePermissions(PERMISSIONS.SALES.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.update(id, tenantId, dto, userId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit sales order' })
  @RequirePermissions(PERMISSIONS.SALES.SUBMIT)
  async submit(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.submit(id, tenantId, userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve sales order' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.approve(
      id,
      dto.notes || '',
      tenantId,
      userId,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject sales order' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.reject(id, dto.reason, tenantId, userId);
  }

  @Post(':id/request-revision')
  @ApiOperation({ summary: 'Request revision for sales order' })
  @RequirePermissions(PERMISSIONS.SALES.APPROVE)
  async requestRevision(
    @Param('id') id: string,
    @Body() dto: RequestRevisionDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.requestRevision(
      id,
      dto.reason,
      tenantId,
      userId,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sales order' })
  @RequirePermissions(PERMISSIONS.SALES.CANCEL)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelDocumentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.cancel(
      id,
      dto.reason || '',
      tenantId,
      userId,
    );
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert sales order to invoice' })
  @RequirePermissions(PERMISSIONS.SALES.ORDERS_CONVERT)
  async convert(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesOrdersService.convertToInvoice(tenantId, id, userId);
  }
}
