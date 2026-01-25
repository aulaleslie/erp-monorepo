import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { PtSessionPackagesService } from './pt-session-packages.service';

@Module({
  imports: [TypeOrmModule.forFeature([PtPackageEntity])],
  providers: [PtSessionPackagesService],
  exports: [PtSessionPackagesService],
})
export class PtSessionPackagesModule {}
