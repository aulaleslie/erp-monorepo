import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesHeaderEntity } from '../../database/entities/sales-header.entity';
import { SalesOrdersModule } from './orders/sales-orders.module';
import { SalesInvoicesModule } from './invoices/sales-invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesHeaderEntity]),
    SalesOrdersModule,
    SalesInvoicesModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule, SalesOrdersModule, SalesInvoicesModule],
})
export class SalesModule {}
