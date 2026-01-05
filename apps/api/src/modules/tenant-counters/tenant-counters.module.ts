import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantCounterEntity } from '../../database/entities';
import { TenantCountersService } from './tenant-counters.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantCounterEntity])],
  providers: [TenantCountersService],
  exports: [TenantCountersService],
})
export class TenantCountersModule {}
