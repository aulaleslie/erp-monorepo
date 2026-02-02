import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentOutboxEntity } from '../../database/entities/document-outbox.entity';
import { DocumentsModule } from '../documents/documents.module';
import { QUEUE_NAMES } from './queue.constants';
import { DocEngineProcessor } from './processors/doc-engine.processor';
import { ExpiryProcessor } from './processors/expiry.processor';
import { OutboxPollerService } from './outbox-poller.service';
import { ExpirySchedulerService } from './expiry-scheduler.service';
import { EventHandlerRegistry } from './handlers/event-handler.registry';
import { NotificationLogEntity } from '../../database/entities/notification-log.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { PtSessionPackagesModule } from '../pt-session-packages/pt-session-packages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.DOC_ENGINE },
      { name: QUEUE_NAMES.EXPIRY },
    ),
    TypeOrmModule.forFeature([DocumentOutboxEntity, NotificationLogEntity]),
    DocumentsModule,
    MembershipsModule,
    PtSessionPackagesModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [
    DocEngineProcessor,
    ExpiryProcessor,
    OutboxPollerService,
    ExpirySchedulerService,
    EventHandlerRegistry,
  ],
  exports: [BullModule, EventHandlerRegistry],
})
export class QueueModule {}
