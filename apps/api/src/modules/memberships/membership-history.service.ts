import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MembershipHistoryEntity } from '../../database/entities/membership-history.entity';
import {
  MembershipHistoryAction,
  MembershipStatus,
} from '@gym-monorepo/shared';

@Injectable()
export class MembershipHistoryService {
  constructor(
    @InjectRepository(MembershipHistoryEntity)
    private readonly historyRepo: Repository<MembershipHistoryEntity>,
  ) {}

  async logHistory(
    membershipId: string,
    action: MembershipHistoryAction,
    data: {
      fromStatus?: MembershipStatus | null;
      toStatus?: MembershipStatus | null;
      notes?: string | null;
      performedByUserId?: string | null;
    } = {},
    manager?: EntityManager,
  ): Promise<MembershipHistoryEntity> {
    const repo = manager
      ? manager.getRepository(MembershipHistoryEntity)
      : this.historyRepo;
    const history = repo.create({
      membershipId,
      action,
      fromStatus: data.fromStatus ?? null,
      toStatus: data.toStatus ?? null,
      notes: data.notes ?? null,
      performedByUserId: data.performedByUserId ?? null,
    });

    return repo.save(history);
  }

  async findByMembershipId(
    membershipId: string,
  ): Promise<MembershipHistoryEntity[]> {
    return this.historyRepo.find({
      where: { membershipId },
      order: { performedAt: 'DESC' },
      relations: ['performedByUser'],
    });
  }
}
