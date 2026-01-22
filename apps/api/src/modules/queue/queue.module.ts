import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentOutboxEntity } from '../../database/entities/document-outbox.entity';
import { DocumentsModule } from '../documents/documents.module';
import { QUEUE_NAMES } from './queue.constants';
import { DocEngineProcessor } from './processors/doc-engine.processor';
import { OutboxPollerService } from './outbox-poller.service';
import { EventHandlerRegistry } from './handlers/event-handler.registry';

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
    BullModule.registerQueue({
      name: QUEUE_NAMES.DOC_ENGINE,
    }),
    TypeOrmModule.forFeature([DocumentOutboxEntity]),
    DocumentsModule,
  ],
  providers: [DocEngineProcessor, OutboxPollerService, EventHandlerRegistry],
  exports: [BullModule, EventHandlerRegistry],
})
export class QueueModule {}
