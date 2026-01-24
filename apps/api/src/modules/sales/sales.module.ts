import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesHeaderEntity } from '../../database/entities/sales-header.entity';
import { SalesOrdersModule } from './orders/sales-orders.module';
import { SalesInvoicesModule } from './invoices/sales-invoices.module';
import { SalesCreditNotesModule } from './credit-notes/sales-credit-notes.module';
import { SalesAttachmentsModule } from './attachments/sales-attachments.module';
import { SalesPdfService } from './pdf/sales-pdf.service';
import { SalesDocumentsController } from './sales-documents.controller';
import { DocumentEntity, TenantEntity } from '../../database/entities';

import { SalesApprovalsModule } from './approvals/sales-approvals.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesHeaderEntity, DocumentEntity, TenantEntity]),
    SalesOrdersModule,
    SalesInvoicesModule,
    SalesCreditNotesModule,
    SalesAttachmentsModule,
    SalesApprovalsModule,
    TenantsModule,
    UsersModule,
  ],
  controllers: [SalesDocumentsController],
  providers: [SalesPdfService],
  exports: [
    TypeOrmModule,
    SalesOrdersModule,
    SalesInvoicesModule,
    SalesCreditNotesModule,
    SalesAttachmentsModule,
    SalesPdfService,
  ],
})
export class SalesModule {}
