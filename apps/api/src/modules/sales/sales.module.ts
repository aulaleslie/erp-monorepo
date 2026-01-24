import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesHeaderEntity } from '../../database/entities/sales-header.entity';
import { SalesOrdersModule } from './orders/sales-orders.module';
import { SalesInvoicesModule } from './invoices/sales-invoices.module';
import { SalesCreditNotesModule } from './credit-notes/sales-credit-notes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesHeaderEntity]),
    SalesOrdersModule,
    SalesInvoicesModule,
    SalesCreditNotesModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    TypeOrmModule,
    SalesOrdersModule,
    SalesInvoicesModule,
    SalesCreditNotesModule,
  ],
})
export class SalesModule {}
