import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuditSubscriber } from './database/subscribers/audit.subscriber';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { PlatformTaxesModule } from './platform/taxes/platform-taxes.module';
import { TenantSettingsModule } from './modules/tenant-settings/tenant-settings.module';
import { PeopleModule } from './modules/people/people.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { StorageModule } from './modules/storage/storage.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { QueueModule } from './modules/queue/queue.module';
import { TagsModule } from './modules/tags/tags.module';
import { RedisCacheModule } from './common/redis/redis-cache.module';
import { SalesModule } from './modules/sales/sales.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { PtSessionPackagesModule } from './modules/pt-session-packages/pt-session-packages.module';
import { TrainerModule } from './modules/trainer/trainer.module';
import { ScheduleBookingsModule } from './modules/schedule-bookings/schedule-bookings.module';
import { GroupSessionsModule } from './modules/group-sessions/group-sessions.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';
import { PermissionGuard } from './modules/users/guards/permission.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    AuditLogsModule,
    TaxesModule,
    PlatformTaxesModule,
    TenantSettingsModule,
    PeopleModule,
    DepartmentsModule,
    CatalogModule,
    StorageModule,
    DocumentsModule,
    QueueModule,
    TagsModule,
    RedisCacheModule,
    SalesModule,
    MembersModule,
    MembershipsModule,
    PtSessionPackagesModule,
    TrainerModule,
    ScheduleBookingsModule,
    GroupSessionsModule,
    AttendanceModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuditSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
