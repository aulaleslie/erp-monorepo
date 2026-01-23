import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesHeaderEntity } from '../../database/entities/sales-header.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalesHeaderEntity])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class SalesModule {}
