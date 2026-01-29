import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';
import { MembershipsService } from '../../memberships/memberships.service';
import { PtSessionPackagesService } from '../../pt-session-packages/pt-session-packages.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationLogEntity } from '../../../database/entities/notification-log.entity';
import { NotificationType, PERMISSIONS } from '@gym-monorepo/shared';
import { UsersService } from '../../users/users.service';

@Processor(QUEUE_NAMES.EXPIRY)
export class ExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(ExpiryProcessor.name);

  constructor(
    private readonly membershipsService: MembershipsService,
    private readonly ptPackagesService: PtSessionPackagesService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    @InjectRepository(NotificationLogEntity)
    private readonly notificationLogRepo: Repository<NotificationLogEntity>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_NAMES.MEMBERSHIP_EXPIRY:
        await this.handleMembershipExpiry();
        break;
      case JOB_NAMES.PT_PACKAGE_EXPIRY:
        await this.handlePtPackageExpiry();
        break;
      case JOB_NAMES.EXPIRY_NOTIFICATION:
        await this.handleExpiryNotifications();
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleMembershipExpiry(): Promise<void> {
    this.logger.log('Starting membership expiry job');
    await this.membershipsService.processExpiries();
    this.logger.log('Completed membership expiry job');
  }

  private async handlePtPackageExpiry(): Promise<void> {
    this.logger.log('Starting PT package expiry job');
    await this.ptPackagesService.processExpiries();
    this.logger.log('Completed PT package expiry job');
  }

  private async handleExpiryNotifications(): Promise<void> {
    this.logger.log('Starting expiry notifications job');
    const intervals = [7, 5, 3, 1];

    for (const daysBefore of intervals) {
      const expiring =
        await this.membershipsService.findExpiringMemberships(daysBefore);

      for (const membership of expiring) {
        // Check if notification already sent for this membership and interval
        const exists = await this.notificationLogRepo.findOne({
          where: {
            tenantId: membership.tenantId,
            notificationType: NotificationType.MEMBERSHIP_EXPIRING,
            referenceId: membership.id,
            daysBefore,
          },
        });

        if (exists) continue;

        // Create in-app notification for admins (users with members.read)
        const admins = await this.usersService.findAllWithPermission(
          membership.tenantId,
          PERMISSIONS.MEMBERS.READ,
        );

        for (const admin of admins) {
          await this.notificationsService.createNotification({
            tenantId: membership.tenantId,
            userId: admin.id,
            type: NotificationType.MEMBERSHIP_EXPIRING,
            title: 'Membership Expiring Soon',
            message: `Member ${membership.member.person.fullName} (${membership.member.memberCode}) membership expires in ${daysBefore} days.`,
            referenceType: 'membership',
            referenceId: membership.id,
          });
        }

        // Log notification
        await this.notificationLogRepo.save(
          this.notificationLogRepo.create({
            tenantId: membership.tenantId,
            notificationType: NotificationType.MEMBERSHIP_EXPIRING,
            referenceId: membership.id,
            daysBefore,
          }),
        );
      }
    }
    this.logger.log('Completed expiry notifications job');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
