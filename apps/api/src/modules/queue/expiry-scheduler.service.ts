import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from './queue.constants';

@Injectable()
export class ExpirySchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ExpirySchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EXPIRY)
    private readonly expiryQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.setupRepeatableJobs();
  }

  private async setupRepeatableJobs() {
    this.logger.log('Setting up repeatable expiry jobs');

    // 1. Membership expiry: Daily at 00:00
    await this.expiryQueue.add(
      JOB_NAMES.MEMBERSHIP_EXPIRY,
      {},
      {
        repeat: {
          pattern: '0 0 * * *', // Every day at midnight
        },
        removeOnComplete: true,
      },
    );

    // 2. PT package expiry: Daily at 00:05
    await this.expiryQueue.add(
      JOB_NAMES.PT_PACKAGE_EXPIRY,
      {},
      {
        repeat: {
          pattern: '5 0 * * *', // Every day at 00:05
        },
        removeOnComplete: true,
      },
    );

    // 3. Expiry notifications: Daily at 08:00
    await this.expiryQueue.add(
      JOB_NAMES.EXPIRY_NOTIFICATION,
      {},
      {
        repeat: {
          pattern: '0 8 * * *', // Every day at 08:00
        },
        removeOnComplete: true,
      },
    );

    this.logger.log('Repeatable expiry jobs scheduled');
  }
}
