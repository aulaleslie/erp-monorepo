import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesHeaderEntity } from '../../database/entities/sales-header.entity';
import { SalesOrdersModule } from './orders/sales-orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([SalesHeaderEntity]), SalesOrdersModule],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule, SalesOrdersModule],
})
export class SalesModule {}
