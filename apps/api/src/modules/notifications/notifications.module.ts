import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { PermissionGuard } from '../users/guards/permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    TenantsModule,
    UsersModule,
  ],
  providers: [NotificationsService, PermissionGuard],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
