import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DocumentEntity,
  TagEntity,
  TagLinkEntity,
} from '../../database/entities';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TagEntity, TagLinkEntity, DocumentEntity]),
    TenantsModule,
    UsersModule,
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
