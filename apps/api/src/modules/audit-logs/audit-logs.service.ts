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

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
