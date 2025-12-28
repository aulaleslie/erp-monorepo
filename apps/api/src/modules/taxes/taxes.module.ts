import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tax } from '../../database/entities/tax.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tax])],
  exports: [TypeOrmModule],
})
export class TaxesModule {}
