import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { JwtModule } from '@nestjs/jwt'; // Likely needed for AuthGuard if it uses JwtService

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity]),
    JwtModule, // Ensure JwtModule is available if AuthGuard needs it
  ],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}
