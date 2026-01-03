import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: { entityName?: string; performedBy?: string },
  ) {
    const query = this.auditLogRepository.createQueryBuilder('log')
      .leftJoin('users', 'user', 'user.id = log.performedBy')
      .select([
        'log.id',
        'log.entityName',
        'log.entityId',
        'log.action',
        'log.performedBy',
        'log.previousValues',
        'log.newValues',
        'log.timestamp',
        'user.id as performedByUser_id',
        'user.fullName as performedByUser_fullName',
      ]);

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

    const rawResults = await query.getRawMany();
    const total = await query.getCount();

    // Transform raw results to include performedByUser
    const items = rawResults.map(row => ({
      id: row.log_id,
      entityName: row.log_entityName,
      entityId: row.log_entityId,
      action: row.log_action,
      performedBy: row.log_performedBy,
      previousValues: row.log_previousValues,
      newValues: row.log_newValues,
      timestamp: row.log_timestamp,
      performedByUser: row.performedByUser_id ? {
        id: row.performedByUser_id,
        fullName: row.performedByUser_fullName,
      } : null,
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
