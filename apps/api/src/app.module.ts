import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

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


import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuditSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
  ],
})
export class AppModule {}
