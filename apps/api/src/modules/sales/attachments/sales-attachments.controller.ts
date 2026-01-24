import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { SalesAttachmentsService } from './sales-attachments.service';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ActiveTenantGuard } from '../../../common/guards/active-tenant.guard';
import { PermissionGuard } from '../../users/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@Controller('sales/documents/:id/attachments')
@UseGuards(AuthGuard('jwt'), ActiveTenantGuard, PermissionGuard)
export class SalesAttachmentsController {
  constructor(private readonly service: SalesAttachmentsService) {}

  @Get()
  @RequirePermissions('sales.read')
  async findAll(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) documentId: string,
  ) {
    return this.service.findAll(tenantId, documentId);
  }

  @Post()
  @RequirePermissions('sales.update')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) documentId: string,
    @UploadedFile() file: UploadedFile,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.upload(tenantId, documentId, file, userId);
  }

  @Delete(':attachmentId')
  @RequirePermissions('sales.update')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) documentId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.service.remove(tenantId, documentId, attachmentId);
  }
}
