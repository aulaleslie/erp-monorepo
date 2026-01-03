import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: { entityName?: string; performedBy?: string },
  ) {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (filters?.entityName) {
      query.andWhere('log.entityName = :entityName', {
        entityName: filters.entityName,
      });
    }

    if (filters?.performedBy) {
      query.andWhere('log.performedBy = :performedBy', {
        performedBy: filters.performedBy,
      });
    }

    query
      .orderBy('log.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await query.getManyAndCount();

    // Get unique user IDs from performedBy
    const userIds = [...new Set(logs.map(log => log.performedBy).filter(Boolean))];
    
    // Fetch users in a single query
    const usersMap = new Map<string, { id: string; fullName: string | null }>();
    if (userIds.length > 0) {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.fullName'])
        .where('user.id IN (:...userIds)', { userIds })
        .getMany();
      
      users.forEach(user => {
        usersMap.set(user.id, { id: user.id, fullName: user.fullName || null });
      });
    }

    // Transform logs to include performedByUser
    const items = logs.map(log => ({
      id: log.id,
      entityName: log.entityName,
      entityId: log.entityId,
      action: log.action,
      performedBy: log.performedBy,
      previousValues: log.previousValues,
      newValues: log.newValues,
      timestamp: log.timestamp,
      performedByUser: log.performedBy ? usersMap.get(log.performedBy) || null : null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
