import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxEntity } from '../../database/entities/tax.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaxEntity])],
  exports: [TypeOrmModule],
})
export class TaxesModule {}
