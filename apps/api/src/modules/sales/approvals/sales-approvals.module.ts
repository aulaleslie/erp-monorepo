import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DocumentApprovalEntity,
  SalesApprovalEntity,
  SalesApprovalLevelEntity,
  SalesApprovalLevelRoleEntity,
  UserEntity,
  TenantUserEntity,
} from '../../../database/entities';
import { DocumentsModule } from '../../documents/documents.module';
import { SalesApprovalsService } from './sales-approvals.service';
import { SalesApprovalsController } from './sales-approvals.controller';
import { TenantsModule } from '../../tenants/tenants.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesApprovalEntity,
      SalesApprovalLevelEntity,
      SalesApprovalLevelRoleEntity,
      DocumentApprovalEntity,
      UserEntity,
      TenantUserEntity,
    ]),
    DocumentsModule,
    TenantsModule,
    UsersModule,
  ],
  controllers: [SalesApprovalsController],
  providers: [SalesApprovalsService],
  exports: [SalesApprovalsService],
})
export class SalesApprovalsModule {}
