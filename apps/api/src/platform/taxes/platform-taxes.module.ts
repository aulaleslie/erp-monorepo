import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformTaxesService } from './platform-taxes.service';
import { PlatformTaxesController } from './platform-taxes.controller';
import { TaxesModule } from '../../modules/taxes/taxes.module';
import { TenantTaxEntity } from '../../database/entities/tenant-tax.entity';

@Module({
  imports: [TaxesModule, TypeOrmModule.forFeature([TenantTaxEntity])],
  controllers: [PlatformTaxesController],
  providers: [PlatformTaxesService],
})
export class PlatformTaxesModule {}
