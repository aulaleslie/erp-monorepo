import { Module } from '@nestjs/common';
import { PlatformTaxesService } from './platform-taxes.service';
import { PlatformTaxesController } from './platform-taxes.controller';
import { TaxesModule } from '../../modules/taxes/taxes.module';

@Module({
  imports: [TaxesModule],
  controllers: [PlatformTaxesController],
  providers: [PlatformTaxesService],
})
export class PlatformTaxesModule {}
